import { Pool } from 'pg';
import { Food, CreateFoodPayload, UpdateFoodPayload, FoodSearchFilters } from '../models/Meal';
import pool from '../config/database';

export class FoodRepository {
  private static pool: Pool = pool;

  // Create new food item
  static async create(foodData: CreateFoodPayload): Promise<Food> {
    const query = `
      INSERT INTO foods (
        food_name, brand, serving_size, serving_unit, calories, protein, carbs, fat, 
        fiber, sugar, sodium, cholesterol, vitamin_a, vitamin_c, calcium, iron,
        food_category, allergens, is_vegetarian, is_vegan, is_gluten_free, barcode, image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *
    `;
    
    const values = [
      foodData.food_name,
      foodData.brand || null,
      foodData.serving_size,
      foodData.serving_unit || 'grams',
      foodData.calories,
      foodData.protein || 0,
      foodData.carbs || 0,
      foodData.fat || 0,
      foodData.fiber || 0,
      foodData.sugar || 0,
      foodData.sodium || 0,
      foodData.cholesterol || 0,
      foodData.vitamin_a || 0,
      foodData.vitamin_c || 0,
      foodData.calcium || 0,
      foodData.iron || 0,
      foodData.food_category || null,
      foodData.allergens || null,
      foodData.is_vegetarian || false,
      foodData.is_vegan || false,
      foodData.is_gluten_free || false,
      foodData.barcode || null,
      foodData.image_url || null
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Get food by ID
  static async findById(foodId: string): Promise<Food | null> {
    const query = 'SELECT * FROM foods WHERE food_id = $1 AND is_active = true';
    const result = await this.pool.query(query, [foodId]);
    return result.rows[0] || null;
  }

  // Search foods with filters
  static async search(filters: FoodSearchFilters, limit = 50, offset = 0): Promise<Food[]> {
    const conditions: string[] = ['is_active = true'];
    const values: any[] = [];
    let paramIndex = 1;

    // Add search conditions
    if (filters.search_term) {
      conditions.push(`(
        food_name ILIKE $${paramIndex} OR 
        brand ILIKE $${paramIndex} OR
        to_tsvector('english', food_name || ' ' || COALESCE(brand, '')) @@ plainto_tsquery('english', $${paramIndex})
      )`);
      values.push(`%${filters.search_term}%`);
      paramIndex++;
    }

    if (filters.category) {
      conditions.push(`food_category = $${paramIndex}`);
      values.push(filters.category);
      paramIndex++;
    }

    if (filters.is_vegetarian !== undefined) {
      conditions.push(`is_vegetarian = $${paramIndex}`);
      values.push(filters.is_vegetarian);
      paramIndex++;
    }

    if (filters.is_vegan !== undefined) {
      conditions.push(`is_vegan = $${paramIndex}`);
      values.push(filters.is_vegan);
      paramIndex++;
    }

    if (filters.is_gluten_free !== undefined) {
      conditions.push(`is_gluten_free = $${paramIndex}`);
      values.push(filters.is_gluten_free);
      paramIndex++;
    }

    if (filters.max_calories) {
      conditions.push(`calories <= $${paramIndex}`);
      values.push(filters.max_calories);
      paramIndex++;
    }

    if (filters.min_protein) {
      conditions.push(`protein >= $${paramIndex}`);
      values.push(filters.min_protein);
      paramIndex++;
    }

    if (filters.exclude_allergens && filters.exclude_allergens.length > 0) {
      conditions.push(`(allergens IS NULL OR NOT (allergens && $${paramIndex}))`);
      values.push(filters.exclude_allergens);
      paramIndex++;
    }

    values.push(limit, offset);

    const query = `
      SELECT * FROM foods 
      WHERE ${conditions.join(' AND ')}
      ORDER BY food_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  // Get foods by category
  static async getByCategory(category: string): Promise<Food[]> {
    const query = `
      SELECT * FROM foods 
      WHERE food_category = $1 AND is_active = true 
      ORDER BY food_name ASC
    `;
    const result = await this.pool.query(query, [category]);
    return result.rows;
  }

  // Get all food categories
  static async getCategories(): Promise<string[]> {
    const query = `
      SELECT DISTINCT food_category 
      FROM foods 
      WHERE food_category IS NOT NULL AND is_active = true 
      ORDER BY food_category ASC
    `;
    const result = await this.pool.query(query);
    return result.rows.map(row => row.food_category);
  }

  // Update food
  static async update(foodId: string, updateData: UpdateFoodPayload): Promise<Food> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateFoodPayload] !== undefined) {
        updateFields.push(`${key} = $${paramIndex++}`);
        values.push(updateData[key as keyof UpdateFoodPayload]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(foodId);

    const query = `
      UPDATE foods 
      SET ${updateFields.join(', ')}
      WHERE food_id = $${paramIndex} AND is_active = true
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Food not found');
    }
    return result.rows[0];
  }

  // Soft delete food
  static async delete(foodId: string): Promise<void> {
    const query = 'UPDATE foods SET is_active = false WHERE food_id = $1';
    await this.pool.query(query, [foodId]);
  }

  // Search by barcode
  static async findByBarcode(barcode: string): Promise<Food | null> {
    const query = 'SELECT * FROM foods WHERE barcode = $1 AND is_active = true';
    const result = await this.pool.query(query, [barcode]);
    return result.rows[0] || null;
  }

  // Get popular foods (most used in meals)
  static async getPopularFoods(limit = 20): Promise<Food[]> {
    const query = `
      SELECT f.*, COUNT(mf.food_id) as usage_count
      FROM foods f
      LEFT JOIN meal_foods mf ON f.food_id = mf.food_id
      WHERE f.is_active = true
      GROUP BY f.food_id
      ORDER BY usage_count DESC, f.food_name ASC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  // Get recently added foods
  static async getRecentFoods(limit = 20): Promise<Food[]> {
    const query = `
      SELECT * FROM foods 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }
}