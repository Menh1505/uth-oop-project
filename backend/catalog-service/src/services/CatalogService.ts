import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Product, CreateProductRequest, UpdateProductRequest, ProductSearchFilters } from '../models/Product';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../models/Category';
import { Inventory, UpdateInventoryRequest, InventoryReservation, InventoryAlert } from '../models/Inventory';
import pool from '../config/database';
import rabbitmqService from '../config/rabbitmq';
import { metrics } from '../middleware/metricsMiddleware';

export class CatalogService {
  
  // Product operations
  async getAllProducts(filters: ProductSearchFilters = {}): Promise<Product[]> {
    try {
      let query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE 1=1
      `;
      const values: any[] = [];
      let paramCount = 0;

      if (filters.categoryId) {
        query += ` AND p.category_id = $${++paramCount}`;
        values.push(filters.categoryId);
      }

      if (filters.minPrice !== undefined) {
        query += ` AND p.price >= $${++paramCount}`;
        values.push(filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query += ` AND p.price <= $${++paramCount}`;
        values.push(filters.maxPrice);
      }

      if (filters.search) {
        query += ` AND (p.name ILIKE $${++paramCount} OR p.description ILIKE $${++paramCount})`;
        values.push(`%${filters.search}%`, `%${filters.search}%`);
        paramCount++;
      }

      if (filters.isActive !== undefined) {
        query += ` AND p.is_active = $${++paramCount}`;
        values.push(filters.isActive);
      }

      query += ` ORDER BY p.created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`;
        values.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${++paramCount}`;
        values.push(filters.offset);
      }

      const result = await pool.query(query, values);
      
      metrics.catalogOperations.labels('get_products', 'success').inc();
      
      return result.rows.map(this.mapRowToProduct);
    } catch (error) {
      metrics.catalogOperations.labels('get_products', 'error').inc();
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const result = await pool.query(
        'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      metrics.catalogOperations.labels('get_product', 'success').inc();
      return this.mapRowToProduct(result.rows[0]);
    } catch (error) {
      metrics.catalogOperations.labels('get_product', 'error').inc();
      throw error;
    }
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const result = await pool.query(`
        INSERT INTO products (
          id, name, description, price, category_id, image_url,
          nutrition_info, allergens, ingredients, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        id, data.name, data.description, data.price, data.categoryId,
        data.imageUrl, JSON.stringify(data.nutritionInfo), 
        data.allergens, data.ingredients, true, now, now
      ]);

      const product = this.mapRowToProduct(result.rows[0]);
      
      // Create initial inventory record
      await pool.query(`
        INSERT INTO inventory (id, product_id, quantity, reserved_quantity, low_stock_threshold, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [uuidv4(), id, 0, 0, 10, now]);

      // Publish event
      await rabbitmqService.publishEvent('product.created', { product });
      
      metrics.catalogOperations.labels('create_product', 'success').inc();
      
      return product;
    } catch (error) {
      metrics.catalogOperations.labels('create_product', 'error').inc();
      throw error;
    }
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product | null> {
    try {
      const existing = await this.getProductById(id);
      if (!existing) {
        return null;
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const fieldsToUpdate = [
        'name', 'description', 'price', 'categoryId', 'imageUrl', 
        'nutritionInfo', 'allergens', 'ingredients', 'isActive'
      ];

      fieldsToUpdate.forEach(field => {
        const dbField = field === 'categoryId' ? 'category_id' : 
                       field === 'imageUrl' ? 'image_url' :
                       field === 'nutritionInfo' ? 'nutrition_info' :
                       field === 'isActive' ? 'is_active' :
                       field.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (data[field as keyof UpdateProductRequest] !== undefined) {
          updateFields.push(`${dbField} = $${++paramCount}`);
          let value = data[field as keyof UpdateProductRequest];
          if (field === 'nutritionInfo') {
            value = JSON.stringify(value);
          }
          values.push(value);
        }
      });

      if (updateFields.length === 0) {
        return existing;
      }

      updateFields.push(`updated_at = $${++paramCount}`);
      values.push(new Date());
      values.push(id);

      const result = await pool.query(`
        UPDATE products SET ${updateFields.join(', ')} 
        WHERE id = $${++paramCount} 
        RETURNING *
      `, values);

      const product = this.mapRowToProduct(result.rows[0]);
      
      // Publish event
      await rabbitmqService.publishEvent('product.updated', { 
        product, 
        previousData: existing 
      });
      
      metrics.catalogOperations.labels('update_product', 'success').inc();
      
      return product;
    } catch (error) {
      metrics.catalogOperations.labels('update_product', 'error').inc();
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const existing = await this.getProductById(id);
      if (!existing) {
        return false;
      }

      await pool.query('DELETE FROM inventory WHERE product_id = $1', [id]);
      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      
      // Publish event
      await rabbitmqService.publishEvent('product.deleted', { 
        productId: id,
        product: existing 
      });
      
      metrics.catalogOperations.labels('delete_product', 'success').inc();
      
      return true;
    } catch (error) {
      metrics.catalogOperations.labels('delete_product', 'error').inc();
      throw error;
    }
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM categories ORDER BY sort_order ASC, name ASC'
      );
      
      metrics.catalogOperations.labels('get_categories', 'success').inc();
      
      return result.rows.map(this.mapRowToCategory);
    } catch (error) {
      metrics.catalogOperations.labels('get_categories', 'error').inc();
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      metrics.catalogOperations.labels('get_category', 'success').inc();
      return this.mapRowToCategory(result.rows[0]);
    } catch (error) {
      metrics.catalogOperations.labels('get_category', 'error').inc();
      throw error;
    }
  }

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const result = await pool.query(`
        INSERT INTO categories (
          id, name, description, image_url, parent_id, is_active, sort_order, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        id, data.name, data.description, data.imageUrl, 
        data.parentId, true, data.sortOrder || 0, now, now
      ]);

      const category = this.mapRowToCategory(result.rows[0]);
      
      metrics.catalogOperations.labels('create_category', 'success').inc();
      
      return category;
    } catch (error) {
      metrics.catalogOperations.labels('create_category', 'error').inc();
      throw error;
    }
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category | null> {
    try {
      const existing = await this.getCategoryById(id);
      if (!existing) {
        return null;
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const fieldsToUpdate = ['name', 'description', 'imageUrl', 'parentId', 'isActive', 'sortOrder'];

      fieldsToUpdate.forEach(field => {
        const dbField = field === 'imageUrl' ? 'image_url' :
                       field === 'parentId' ? 'parent_id' :
                       field === 'isActive' ? 'is_active' :
                       field === 'sortOrder' ? 'sort_order' :
                       field.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (data[field as keyof UpdateCategoryRequest] !== undefined) {
          updateFields.push(`${dbField} = $${++paramCount}`);
          values.push(data[field as keyof UpdateCategoryRequest]);
        }
      });

      if (updateFields.length === 0) {
        return existing;
      }

      updateFields.push(`updated_at = $${++paramCount}`);
      values.push(new Date());
      values.push(id);

      const result = await pool.query(`
        UPDATE categories SET ${updateFields.join(', ')} 
        WHERE id = $${++paramCount} 
        RETURNING *
      `, values);

      const category = this.mapRowToCategory(result.rows[0]);
      
      metrics.catalogOperations.labels('update_category', 'success').inc();
      
      return category;
    } catch (error) {
      metrics.catalogOperations.labels('update_category', 'error').inc();
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
      
      metrics.catalogOperations.labels('delete_category', 'success').inc();
      
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      metrics.catalogOperations.labels('delete_category', 'error').inc();
      throw error;
    }
  }

  // Inventory operations
  async getProductInventory(productId: string): Promise<Inventory | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM inventory WHERE product_id = $1',
        [productId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const inventory = this.mapRowToInventory(result.rows[0]);
      
      // Update metrics
      const product = await this.getProductById(productId);
      if (product) {
        metrics.inventoryLevels
          .labels(productId, product.name)
          .set(inventory.quantity);
      }
      
      metrics.catalogOperations.labels('get_inventory', 'success').inc();
      
      return inventory;
    } catch (error) {
      metrics.catalogOperations.labels('get_inventory', 'error').inc();
      throw error;
    }
  }

  async updateProductInventory(productId: string, data: UpdateInventoryRequest): Promise<Inventory | null> {
    try {
      const existing = await this.getProductInventory(productId);
      if (!existing) {
        return null;
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const fieldsToUpdate = ['quantity', 'reservedQuantity', 'lowStockThreshold', 'restockDate'];

      fieldsToUpdate.forEach(field => {
        const dbField = field === 'reservedQuantity' ? 'reserved_quantity' :
                       field === 'lowStockThreshold' ? 'low_stock_threshold' :
                       field === 'restockDate' ? 'restock_date' :
                       field.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (data[field as keyof UpdateInventoryRequest] !== undefined) {
          updateFields.push(`${dbField} = $${++paramCount}`);
          values.push(data[field as keyof UpdateInventoryRequest]);
        }
      });

      if (updateFields.length === 0) {
        return existing;
      }

      updateFields.push(`updated_at = $${++paramCount}`);
      values.push(new Date());
      values.push(productId);

      const result = await pool.query(`
        UPDATE inventory SET ${updateFields.join(', ')} 
        WHERE product_id = $${++paramCount} 
        RETURNING *
      `, values);

      const inventory = this.mapRowToInventory(result.rows[0]);
      
      // Check for low stock alerts
      if (inventory.quantity <= inventory.lowStockThreshold) {
        metrics.lowStockAlerts.labels(productId).inc();
        
        await rabbitmqService.publishEvent('inventory.low_stock', {
          productId,
          currentQuantity: inventory.quantity,
          threshold: inventory.lowStockThreshold
        });
      }
      
      // Update metrics
      const product = await this.getProductById(productId);
      if (product) {
        metrics.inventoryLevels
          .labels(productId, product.name)
          .set(inventory.quantity);
      }
      
      // Publish inventory update event
      await rabbitmqService.publishEvent('inventory.updated', {
        inventory,
        previousData: existing
      });
      
      metrics.catalogOperations.labels('update_inventory', 'success').inc();
      
      return inventory;
    } catch (error) {
      metrics.catalogOperations.labels('update_inventory', 'error').inc();
      throw error;
    }
  }

  async reserveInventory(reservations: InventoryReservation[]): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const reservation of reservations) {
        const result = await client.query(`
          UPDATE inventory 
          SET reserved_quantity = reserved_quantity + $1
          WHERE product_id = $2 AND (quantity - reserved_quantity) >= $1
          RETURNING *
        `, [reservation.quantity, reservation.productId]);
        
        if ((result.rowCount ?? 0) === 0) {
          await client.query('ROLLBACK');
          return false;
        }
      }
      
      await client.query('COMMIT');
      
      // Publish reservation events
      for (const reservation of reservations) {
        await rabbitmqService.publishEvent('inventory.reserved', reservation);
      }
      
      metrics.catalogOperations.labels('reserve_inventory', 'success').inc();
      
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      metrics.catalogOperations.labels('reserve_inventory', 'error').inc();
      throw error;
    } finally {
      client.release();
    }
  }

  // Helper methods
  private mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      categoryId: row.category_id,
      imageUrl: row.image_url,
      nutritionInfo: row.nutrition_info ? JSON.parse(row.nutrition_info) : undefined,
      allergens: row.allergens,
      ingredients: row.ingredients,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      parentId: row.parent_id,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToInventory(row: any): Inventory {
    return {
      id: row.id,
      productId: row.product_id,
      quantity: row.quantity,
      reservedQuantity: row.reserved_quantity,
      lowStockThreshold: row.low_stock_threshold,
      restockDate: row.restock_date,
      updatedAt: row.updated_at
    };
  }
}