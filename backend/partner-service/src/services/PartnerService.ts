import { Pool, PoolClient } from 'pg';
import { 
  Partner, Restaurant, MenuItem, Promotion, Inventory,
  CreatePartnerRequest, UpdatePartnerRequest,
  CreateRestaurantRequest, UpdateRestaurantRequest,
  CreateMenuItemRequest, UpdateMenuItemRequest,
  CreatePromotionRequest, UpdatePromotionRequest,
  CreateInventoryRequest, UpdateInventoryRequest,
  PartnerFilters, RestaurantFilters, MenuItemFilters, 
  PromotionFilters, InventoryFilters,
  PartnerStatus, RestaurantStatus, MenuItemStatus, 
  PromotionStatus, InventoryStatus,
  PartnerAnalytics, RestaurantAnalytics, MenuAnalytics, InventoryAnalytics
} from '../models/Partner';

export class PartnerService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'partner_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  // ============= PARTNER MANAGEMENT =============

  async createPartner(userId: string, partnerData: CreatePartnerRequest): Promise<Partner> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        INSERT INTO partners (
          user_id, business_name, business_type, tax_id, contact_person, 
          contact_email, contact_phone, commission_rate, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        userId, partnerData.business_name, partnerData.business_type,
        partnerData.tax_id, partnerData.contact_person, partnerData.contact_email,
        partnerData.contact_phone, partnerData.commission_rate || 0.15, 
        PartnerStatus.PENDING
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create partner: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async getPartnerById(partnerId: string, userId?: string): Promise<Partner | null> {
    try {
      let query = 'SELECT * FROM partners WHERE id = $1';
      const params = [partnerId];

      if (userId) {
        query += ' AND user_id = $2';
        params.push(userId);
      }

      const result = await this.pool.query(query, params);
      return result.rows[0] || null;
    } catch (error: any) {
      throw new Error(`Failed to get partner: ${error.message}`);
    }
  }

  async getPartnersByUser(userId: string, filters: PartnerFilters = {}): Promise<Partner[]> {
    try {
      let query = `
        SELECT p.*, 
               COUNT(r.id) as total_restaurants,
               COALESCE(SUM(r.total_orders * r.average_order_value), 0) as total_revenue
        FROM partners p
        LEFT JOIN restaurants r ON p.id = r.partner_id
        WHERE p.user_id = $1
      `;
      const params: any[] = [userId];
      let paramCount = 1;

      // Apply filters
      if (filters.status) {
        paramCount++;
        query += ` AND p.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.business_type) {
        paramCount++;
        query += ` AND p.business_type = $${paramCount}`;
        params.push(filters.business_type);
      }

      if (filters.search) {
        paramCount++;
        query += ` AND (p.business_name ILIKE $${paramCount} OR p.contact_person ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
      }

      query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      if (filters.offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error: any) {
      throw new Error(`Failed to get partners: ${error.message}`);
    }
  }

  async updatePartner(partnerId: string, userId: string, updateData: UpdatePartnerRequest): Promise<Partner | null> {
    const client = await this.pool.connect();
    try {
      const setClauses: string[] = [];
      const params: any[] = [partnerId, userId];
      let paramCount = 2;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++;
          setClauses.push(`${key} = $${paramCount}`);
          params.push(value);
        }
      });

      if (setClauses.length === 0) {
        throw new Error('No fields to update');
      }

      const query = `
        UPDATE partners 
        SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await client.query(query, params);
      return result.rows[0] || null;
    } catch (error: any) {
      throw new Error(`Failed to update partner: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // ============= RESTAURANT MANAGEMENT =============

  async createRestaurant(partnerId: string, userId: string, restaurantData: CreateRestaurantRequest): Promise<Restaurant> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify partner ownership
      const partnerCheck = await client.query(
        'SELECT id FROM partners WHERE id = $1 AND user_id = $2 AND status = $3',
        [partnerId, userId, PartnerStatus.ACTIVE]
      );

      if (partnerCheck.rows.length === 0) {
        throw new Error('Partner not found or not authorized');
      }

      const result = await client.query(`
        INSERT INTO restaurants (
          partner_id, name, description, type, phone, email, website,
          address, city, district, ward, latitude, longitude,
          opening_hours, delivery_fee, minimum_order, delivery_radius,
          logo_url, cover_image_url, gallery_images, features
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *
      `, [
        partnerId, restaurantData.name, restaurantData.description, restaurantData.type,
        restaurantData.phone, restaurantData.email, restaurantData.website,
        restaurantData.address, restaurantData.city, restaurantData.district,
        restaurantData.ward, restaurantData.latitude, restaurantData.longitude,
        JSON.stringify(restaurantData.opening_hours), restaurantData.delivery_fee,
        restaurantData.minimum_order, restaurantData.delivery_radius,
        restaurantData.logo_url, restaurantData.cover_image_url,
        JSON.stringify(restaurantData.gallery_images || []),
        JSON.stringify(restaurantData.features || [])
      ]);

      // Update partner's restaurant count
      await client.query(
        'UPDATE partners SET total_restaurants = total_restaurants + 1 WHERE id = $1',
        [partnerId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create restaurant: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async getRestaurantById(restaurantId: string, userId?: string): Promise<Restaurant | null> {
    try {
      let query = `
        SELECT r.*, p.user_id as partner_user_id
        FROM restaurants r
        JOIN partners p ON r.partner_id = p.id
        WHERE r.id = $1
      `;
      const params = [restaurantId];

      if (userId) {
        query += ' AND p.user_id = $2';
        params.push(userId);
      }

      const result = await this.pool.query(query, params);
      return result.rows[0] || null;
    } catch (error: any) {
      throw new Error(`Failed to get restaurant: ${error.message}`);
    }
  }

  async getRestaurantsByPartner(partnerId: string, userId: string, filters: RestaurantFilters = {}): Promise<Restaurant[]> {
    try {
      let query = `
        SELECT r.*, p.user_id as partner_user_id
        FROM restaurants r
        JOIN partners p ON r.partner_id = p.id
        WHERE r.partner_id = $1 AND p.user_id = $2
      `;
      const params: any[] = [partnerId, userId];
      let paramCount = 2;

      // Apply filters
      if (filters.type) {
        paramCount++;
        query += ` AND r.type = $${paramCount}`;
        params.push(filters.type);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND r.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.city) {
        paramCount++;
        query += ` AND r.city = $${paramCount}`;
        params.push(filters.city);
      }

      if (filters.search) {
        paramCount++;
        query += ` AND (r.name ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
      }

      query += ` ORDER BY r.created_at DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error: any) {
      throw new Error(`Failed to get restaurants: ${error.message}`);
    }
  }

  async searchRestaurants(filters: RestaurantFilters = {}): Promise<Restaurant[]> {
    try {
      let query = `
        SELECT r.*, p.business_name as partner_name
        FROM restaurants r
        JOIN partners p ON r.partner_id = p.id
        WHERE r.status = $1 AND p.status = $2
      `;
      const params: any[] = [RestaurantStatus.OPEN, PartnerStatus.ACTIVE];
      let paramCount = 2;

      // Location-based search
      if (filters.latitude && filters.longitude && filters.radius) {
        paramCount += 3;
        query += ` AND (
          6371 * acos(
            cos(radians($${paramCount-2})) * cos(radians(r.latitude)) *
            cos(radians(r.longitude) - radians($${paramCount-1})) +
            sin(radians($${paramCount-2})) * sin(radians(r.latitude))
          )
        ) <= $${paramCount}`;
        params.push(filters.latitude, filters.longitude, filters.radius);
      }

      // Other filters
      if (filters.type) {
        paramCount++;
        query += ` AND r.type = $${paramCount}`;
        params.push(filters.type);
      }

      if (filters.city) {
        paramCount++;
        query += ` AND r.city = $${paramCount}`;
        params.push(filters.city);
      }

      if (filters.min_rating) {
        paramCount++;
        query += ` AND r.rating >= $${paramCount}`;
        params.push(filters.min_rating);
      }

      if (filters.search) {
        paramCount++;
        query += ` AND (r.name ILIKE $${paramCount} OR r.description ILIKE $${paramCount} OR p.business_name ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
      }

      query += ` ORDER BY r.rating DESC, r.total_reviews DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error: any) {
      throw new Error(`Failed to search restaurants: ${error.message}`);
    }
  }

  async updateRestaurant(restaurantId: string, userId: string, updateData: UpdateRestaurantRequest): Promise<Restaurant | null> {
    const client = await this.pool.connect();
    try {
      const setClauses: string[] = [];
      const params: any[] = [restaurantId, userId];
      let paramCount = 2;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++;
          if (key === 'opening_hours' || key === 'gallery_images' || key === 'features') {
            setClauses.push(`${key} = $${paramCount}`);
            params.push(JSON.stringify(value));
          } else {
            setClauses.push(`${key} = $${paramCount}`);
            params.push(value);
          }
        }
      });

      if (setClauses.length === 0) {
        throw new Error('No fields to update');
      }

      const query = `
        UPDATE restaurants r
        SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
        FROM partners p
        WHERE r.id = $1 AND r.partner_id = p.id AND p.user_id = $2
        RETURNING r.*
      `;

      const result = await client.query(query, params);
      return result.rows[0] || null;
    } catch (error: any) {
      throw new Error(`Failed to update restaurant: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // ============= MENU MANAGEMENT =============

  async createMenuItem(restaurantId: string, userId: string, itemData: CreateMenuItemRequest): Promise<MenuItem> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify restaurant ownership
      const restaurantCheck = await client.query(`
        SELECT r.id FROM restaurants r
        JOIN partners p ON r.partner_id = p.id
        WHERE r.id = $1 AND p.user_id = $2
      `, [restaurantId, userId]);

      if (restaurantCheck.rows.length === 0) {
        throw new Error('Restaurant not found or not authorized');
      }

      const result = await client.query(`
        INSERT INTO menu_items (
          restaurant_id, catalog_item_id, name, description, category,
          base_price, sale_price, currency, calories, ingredients, allergens,
          dietary_info, image_url, gallery_images, available_days, 
          available_times, inventory_tracked, customization_options
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `, [
        restaurantId, itemData.catalog_item_id, itemData.name, itemData.description,
        itemData.category, itemData.base_price, itemData.sale_price,
        itemData.currency || 'VND', itemData.calories,
        JSON.stringify(itemData.ingredients || []),
        JSON.stringify(itemData.allergens || []),
        JSON.stringify(itemData.dietary_info || []),
        itemData.image_url, JSON.stringify(itemData.gallery_images || []),
        JSON.stringify(itemData.available_days || []),
        JSON.stringify(itemData.available_times || []),
        itemData.inventory_tracked || false,
        JSON.stringify(itemData.customization_options || [])
      ]);

      // Update restaurant's menu item count
      await client.query(
        'UPDATE restaurants SET total_menu_items = total_menu_items + 1 WHERE id = $1',
        [restaurantId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create menu item: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async getMenuItems(restaurantId: string, filters: MenuItemFilters = {}): Promise<MenuItem[]> {
    try {
      let query = `
        SELECT m.*, r.name as restaurant_name, r.status as restaurant_status
        FROM menu_items m
        JOIN restaurants r ON m.restaurant_id = r.id
        WHERE m.restaurant_id = $1
      `;
      const params: any[] = [restaurantId];
      let paramCount = 1;

      // Apply filters
      if (filters.category) {
        paramCount++;
        query += ` AND m.category = $${paramCount}`;
        params.push(filters.category);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND m.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.min_price) {
        paramCount++;
        query += ` AND m.base_price >= $${paramCount}`;
        params.push(filters.min_price);
      }

      if (filters.max_price) {
        paramCount++;
        query += ` AND m.base_price <= $${paramCount}`;
        params.push(filters.max_price);
      }

      if (filters.search) {
        paramCount++;
        query += ` AND (m.name ILIKE $${paramCount} OR m.description ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
      }

      query += ` ORDER BY m.order_count DESC, m.created_at DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error: any) {
      throw new Error(`Failed to get menu items: ${error.message}`);
    }
  }

  async updateMenuItem(itemId: string, userId: string, updateData: UpdateMenuItemRequest): Promise<MenuItem | null> {
    const client = await this.pool.connect();
    try {
      const setClauses: string[] = [];
      const params: any[] = [itemId, userId];
      let paramCount = 2;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++;
          if (['ingredients', 'allergens', 'dietary_info', 'gallery_images', 
               'available_days', 'available_times', 'customization_options'].includes(key)) {
            setClauses.push(`${key} = $${paramCount}`);
            params.push(JSON.stringify(value));
          } else {
            setClauses.push(`${key} = $${paramCount}`);
            params.push(value);
          }
        }
      });

      if (setClauses.length === 0) {
        throw new Error('No fields to update');
      }

      const query = `
        UPDATE menu_items m
        SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
        FROM restaurants r, partners p
        WHERE m.id = $1 AND m.restaurant_id = r.id AND r.partner_id = p.id AND p.user_id = $2
        RETURNING m.*
      `;

      const result = await client.query(query, params);
      return result.rows[0] || null;
    } catch (error: any) {
      throw new Error(`Failed to update menu item: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // ============= PROMOTION MANAGEMENT =============

  async createPromotion(restaurantId: string, userId: string, promotionData: CreatePromotionRequest): Promise<Promotion> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify restaurant ownership and get partner_id
      const restaurantCheck = await client.query(`
        SELECT r.id, r.partner_id FROM restaurants r
        JOIN partners p ON r.partner_id = p.id
        WHERE r.id = $1 AND p.user_id = $2
      `, [restaurantId, userId]);

      if (restaurantCheck.rows.length === 0) {
        throw new Error('Restaurant not found or not authorized');
      }

      const partnerId = restaurantCheck.rows[0].partner_id;

      const result = await client.query(`
        INSERT INTO promotions (
          restaurant_id, partner_id, name, description, type, discount_value,
          max_discount_amount, min_order_amount, start_date, end_date,
          usage_limit, usage_per_customer, applicable_items, applicable_categories,
          applicable_days, applicable_times, promo_code, auto_apply
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `, [
        restaurantId, partnerId, promotionData.name, promotionData.description,
        promotionData.type, promotionData.discount_value,
        promotionData.max_discount_amount, promotionData.min_order_amount,
        promotionData.start_date, promotionData.end_date,
        promotionData.usage_limit, promotionData.usage_per_customer,
        JSON.stringify(promotionData.applicable_items || []),
        JSON.stringify(promotionData.applicable_categories || []),
        JSON.stringify(promotionData.applicable_days || []),
        JSON.stringify(promotionData.applicable_times || []),
        promotionData.promo_code, promotionData.auto_apply || false
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create promotion: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async getPromotions(restaurantId: string, userId: string, filters: PromotionFilters = {}): Promise<Promotion[]> {
    try {
      let query = `
        SELECT pr.*, r.name as restaurant_name
        FROM promotions pr
        JOIN restaurants r ON pr.restaurant_id = r.id
        JOIN partners p ON r.partner_id = p.id
        WHERE pr.restaurant_id = $1 AND p.user_id = $2
      `;
      const params: any[] = [restaurantId, userId];
      let paramCount = 2;

      // Apply filters
      if (filters.status) {
        paramCount++;
        query += ` AND pr.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.type) {
        paramCount++;
        query += ` AND pr.type = $${paramCount}`;
        params.push(filters.type);
      }

      if (filters.active_now) {
        query += ` AND pr.status = 'ACTIVE' AND pr.start_date <= CURRENT_TIMESTAMP AND pr.end_date >= CURRENT_TIMESTAMP`;
      }

      query += ` ORDER BY pr.created_at DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error: any) {
      throw new Error(`Failed to get promotions: ${error.message}`);
    }
  }

  // ============= INVENTORY MANAGEMENT =============

  async createInventory(restaurantId: string, userId: string, inventoryData: CreateInventoryRequest): Promise<Inventory> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify restaurant ownership
      const restaurantCheck = await client.query(`
        SELECT r.id FROM restaurants r
        JOIN partners p ON r.partner_id = p.id
        WHERE r.id = $1 AND p.user_id = $2
      `, [restaurantId, userId]);

      if (restaurantCheck.rows.length === 0) {
        throw new Error('Restaurant not found or not authorized');
      }

      const result = await client.query(`
        INSERT INTO inventory (
          restaurant_id, menu_item_id, ingredient_name, current_stock,
          minimum_stock, maximum_stock, unit, cost_per_unit,
          supplier_name, supplier_contact, expiry_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        restaurantId, inventoryData.menu_item_id, inventoryData.ingredient_name,
        inventoryData.current_stock, inventoryData.minimum_stock,
        inventoryData.maximum_stock, inventoryData.unit, inventoryData.cost_per_unit,
        inventoryData.supplier_name, inventoryData.supplier_contact,
        inventoryData.expiry_date
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create inventory: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async getInventory(restaurantId: string, userId: string, filters: InventoryFilters = {}): Promise<Inventory[]> {
    try {
      let query = `
        SELECT i.*, m.name as menu_item_name, r.name as restaurant_name
        FROM inventory i
        JOIN restaurants r ON i.restaurant_id = r.id
        JOIN partners p ON r.partner_id = p.id
        LEFT JOIN menu_items m ON i.menu_item_id = m.id
        WHERE i.restaurant_id = $1 AND p.user_id = $2
      `;
      const params: any[] = [restaurantId, userId];
      let paramCount = 2;

      // Apply filters
      if (filters.status) {
        paramCount++;
        query += ` AND i.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.low_stock_only) {
        query += ` AND i.current_stock <= i.minimum_stock`;
      }

      if (filters.expiring_soon) {
        query += ` AND i.expiry_date <= CURRENT_DATE + INTERVAL '7 days'`;
      }

      if (filters.ingredient_name) {
        paramCount++;
        query += ` AND i.ingredient_name ILIKE $${paramCount}`;
        params.push(`%${filters.ingredient_name}%`);
      }

      query += ` ORDER BY i.created_at DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error: any) {
      throw new Error(`Failed to get inventory: ${error.message}`);
    }
  }

  // ============= ANALYTICS =============

  async getPartnerAnalytics(userId?: string, startDate?: Date, endDate?: Date): Promise<PartnerAnalytics> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_partners,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_partners,
          COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as new_partners_this_month,
          COALESCE(SUM(total_revenue), 0) as total_revenue,
          COALESCE(AVG(commission_rate), 0) as average_commission_rate
        FROM partners
      `;
      const params: any[] = [];

      if (userId) {
        query += ` WHERE user_id = $1`;
        params.push(userId);
      }

      const result = await this.pool.query(query, params);
      const stats = result.rows[0];

      // Get top performing partners
      const topPartnersQuery = `
        SELECT p.id as partner_id, p.business_name, p.total_revenue as revenue,
               COUNT(r.id) as restaurant_count
        FROM partners p
        LEFT JOIN restaurants r ON p.id = r.partner_id
        ${userId ? 'WHERE p.user_id = $1' : ''}
        GROUP BY p.id, p.business_name, p.total_revenue
        ORDER BY p.total_revenue DESC
        LIMIT 10
      `;

      const topPartnersResult = await this.pool.query(
        topPartnersQuery, 
        userId ? [userId] : []
      );

      return {
        total_partners: parseInt(stats.total_partners),
        active_partners: parseInt(stats.active_partners),
        new_partners_this_month: parseInt(stats.new_partners_this_month),
        total_revenue: parseFloat(stats.total_revenue),
        average_commission_rate: parseFloat(stats.average_commission_rate),
        top_performing_partners: topPartnersResult.rows
      };
    } catch (error: any) {
      throw new Error(`Failed to get partner analytics: ${error.message}`);
    }
  }

  async getRestaurantAnalytics(partnerId?: string, userId?: string): Promise<RestaurantAnalytics> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_restaurants,
          COUNT(CASE WHEN r.status = 'OPEN' THEN 1 END) as open_restaurants,
          COALESCE(AVG(r.rating), 0) as average_rating,
          r.type,
          r.city,
          COUNT(*) as count
        FROM restaurants r
        JOIN partners p ON r.partner_id = p.id
      `;
      const params: any[] = [];
      let paramCount = 0;

      if (partnerId && userId) {
        paramCount += 2;
        query += ` WHERE r.partner_id = $1 AND p.user_id = $2`;
        params.push(partnerId, userId);
      }

      query += ` GROUP BY r.type, r.city`;

      const result = await this.pool.query(query, params);

      // Aggregate results
      const restaurants_by_type: Record<string, number> = {};
      const restaurants_by_city: Record<string, number> = {};
      let total_restaurants = 0;
      let open_restaurants = 0;
      let average_rating = 0;

      result.rows.forEach(row => {
        total_restaurants += parseInt(row.count);
        restaurants_by_type[row.type] = (restaurants_by_type[row.type] || 0) + parseInt(row.count);
        restaurants_by_city[row.city] = (restaurants_by_city[row.city] || 0) + parseInt(row.count);
      });

      // Get top rated restaurants
      const topRatedQuery = `
        SELECT r.id as restaurant_id, r.name, r.rating, r.total_reviews
        FROM restaurants r
        JOIN partners p ON r.partner_id = p.id
        ${partnerId && userId ? 'WHERE r.partner_id = $1 AND p.user_id = $2' : ''}
        ORDER BY r.rating DESC, r.total_reviews DESC
        LIMIT 10
      `;

      const topRatedResult = await this.pool.query(
        topRatedQuery,
        partnerId && userId ? [partnerId, userId] : []
      );

      return {
        total_restaurants,
        open_restaurants,
        average_rating,
        top_rated_restaurants: topRatedResult.rows,
        restaurants_by_type: restaurants_by_type as any,
        restaurants_by_city
      };
    } catch (error: any) {
      throw new Error(`Failed to get restaurant analytics: ${error.message}`);
    }
  }

  // ============= UTILITY METHODS =============

  async updateRestaurantStatus(restaurantId: string, userId: string, status: RestaurantStatus): Promise<Restaurant | null> {
    return this.updateRestaurant(restaurantId, userId, { status });
  }

  async updateMenuItemStatus(itemId: string, userId: string, status: MenuItemStatus): Promise<MenuItem | null> {
    return this.updateMenuItem(itemId, userId, { status });
  }

  async updatePromotionStatus(promotionId: string, userId: string, status: PromotionStatus): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        UPDATE promotions pr
        SET status = $3, updated_at = CURRENT_TIMESTAMP
        FROM restaurants r, partners p
        WHERE pr.id = $1 AND pr.restaurant_id = r.id AND r.partner_id = p.id AND p.user_id = $2
        RETURNING pr.id
      `, [promotionId, userId, status]);

      return result.rows.length > 0;
    } catch (error: any) {
      throw new Error(`Failed to update promotion status: ${error.message}`);
    }
  }

  async checkLowStock(restaurantId: string, userId: string): Promise<Inventory[]> {
    return this.getInventory(restaurantId, userId, { 
      low_stock_only: true,
      limit: 50 
    });
  }

  async checkExpiringItems(restaurantId: string, userId: string): Promise<Inventory[]> {
    return this.getInventory(restaurantId, userId, { 
      expiring_soon: true,
      limit: 50 
    });
  }
}