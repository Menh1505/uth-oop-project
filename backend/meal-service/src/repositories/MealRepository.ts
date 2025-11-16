import { Pool } from 'pg';
import { 
  Meal, 
  MealFood, 
  MealWithFoods, 
  MealFoodWithDetails,
  CreateMealPayload, 
  UpdateMealPayload,
  AddFoodToMealPayload,
  UpdateMealFoodPayload,
  NutritionSummary,
  DailyNutritionSummary,
  Food
} from '../models/Meal';
import pool from '../config/database';

export class MealRepository {
  private static pool: Pool = pool;

  // Create new meal
  static async create(userId: string, mealData: CreateMealPayload): Promise<Meal> {
    const query = `
      INSERT INTO meals (user_id, meal_type, meal_date, meal_time, meal_name, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      userId,
      mealData.meal_type,
      mealData.meal_date,
      mealData.meal_time || null,
      mealData.meal_name || null,
      mealData.notes || null
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Get meal by ID
  static async findById(mealId: string): Promise<Meal | null> {
    const query = 'SELECT * FROM meals WHERE meal_id = $1';
    const result = await this.pool.query(query, [mealId]);
    return result.rows[0] || null;
  }

  // Get meal with foods
  static async findByIdWithFoods(mealId: string): Promise<MealWithFoods | null> {
    const mealQuery = 'SELECT * FROM meals WHERE meal_id = $1';
    const mealResult = await this.pool.query(mealQuery, [mealId]);
    
    if (mealResult.rows.length === 0) {
      return null;
    }

    const meal = mealResult.rows[0];

    const foodsQuery = `
      SELECT 
        mf.*,
        f.*
      FROM meal_foods mf
      JOIN foods f ON mf.food_id = f.food_id
      WHERE mf.meal_id = $1
      ORDER BY mf.created_at ASC
    `;
    const foodsResult = await this.pool.query(foodsQuery, [mealId]);

        const foods: MealFoodWithDetails[] = foodsResult.rows.map(row => ({
      id: row.meal_food_id,
      meal_food_id: row.meal_food_id,
      meal_id: row.meal_id,
      food_id: row.food_id,
      quantity: row.quantity,
      unit: row.unit,
      calories_consumed: row.calories_consumed,
      protein_consumed: row.protein_consumed,
      carbs_consumed: row.carbs_consumed,
      fat_consumed: row.fat_consumed,
      notes: row.notes,
      created_at: row.created_at,
      food: {
        id: row.food_id,
        food_id: row.food_id,
        food_name: row.food_name,
        category: row.food_category || 'General',
        brand: row.brand,
        serving_size: row.serving_size,
        serving_unit: row.serving_unit,
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
        fiber: row.fiber,
        sugar: row.sugar,
        sodium: row.sodium,
        cholesterol: row.cholesterol,
        vitamin_a: row.vitamin_a,
        vitamin_c: row.vitamin_c,
        calcium: row.calcium,
        iron: row.iron,
        barcode: row.barcode,
        is_active: row.is_active
      } as Food
    }));

    return { ...meal, foods };
  }

  // Get user meals for a specific date
  static async getUserMealsByDate(userId: string, date: string): Promise<MealWithFoods[]> {
    const query = `
      SELECT * FROM meals 
      WHERE user_id = $1 AND meal_date = $2
      ORDER BY meal_time ASC, created_at ASC
    `;
    const result = await this.pool.query(query, [userId, date]);
    
    const meals: MealWithFoods[] = [];
    for (const meal of result.rows) {
      const mealWithFoods = await this.findByIdWithFoods(meal.meal_id);
      if (mealWithFoods) {
        meals.push(mealWithFoods);
      }
    }
    
    return meals;
  }

  // Get user meals for date range
  static async getUserMealsByDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<MealWithFoods[]> {
    const query = `
      SELECT * FROM meals 
      WHERE user_id = $1 AND meal_date BETWEEN $2 AND $3
      ORDER BY meal_date DESC, meal_time ASC, created_at ASC
    `;
    const result = await this.pool.query(query, [userId, startDate, endDate]);
    
    const meals: MealWithFoods[] = [];
    for (const meal of result.rows) {
      const mealWithFoods = await this.findByIdWithFoods(meal.meal_id);
      if (mealWithFoods) {
        meals.push(mealWithFoods);
      }
    }
    
    return meals;
  }

  // Update meal
  static async update(mealId: string, updateData: UpdateMealPayload): Promise<Meal> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.meal_type !== undefined) {
      updateFields.push(`meal_type = $${paramIndex++}`);
      values.push(updateData.meal_type);
    }
    if (updateData.meal_time !== undefined) {
      updateFields.push(`meal_time = $${paramIndex++}`);
      values.push(updateData.meal_time);
    }
    if (updateData.meal_name !== undefined) {
      updateFields.push(`meal_name = $${paramIndex++}`);
      values.push(updateData.meal_name);
    }
    if (updateData.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      values.push(updateData.notes);
    }
    if (updateData.is_completed !== undefined) {
      updateFields.push(`is_completed = $${paramIndex++}`);
      values.push(updateData.is_completed);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(mealId);

    const query = `
      UPDATE meals 
      SET ${updateFields.join(', ')}
      WHERE meal_id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Meal not found');
    }
    return result.rows[0];
  }

  // Delete meal
  static async delete(mealId: string): Promise<void> {
    const query = 'DELETE FROM meals WHERE meal_id = $1';
    await this.pool.query(query, [mealId]);
  }

  // Add food to meal
  static async addFood(mealId: string, foodData: AddFoodToMealPayload): Promise<MealFood> {
    // Calculate nutrition values based on quantity
    const foodQuery = 'SELECT * FROM foods WHERE food_id = $1';
    const foodResult = await this.pool.query(foodQuery, [foodData.food_id]);
    
    if (foodResult.rows.length === 0) {
      throw new Error('Food not found');
    }

    const food = foodResult.rows[0];
    const ratio = foodData.quantity / food.serving_size;

    const query = `
      INSERT INTO meal_foods (
        meal_id, food_id, quantity, unit, calories_consumed, 
        protein_consumed, carbs_consumed, fat_consumed, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      mealId,
      foodData.food_id,
      foodData.quantity,
      foodData.unit || 'grams',
      Math.round(food.calories * ratio * 100) / 100,
      Math.round(food.protein * ratio * 100) / 100,
      Math.round(food.carbs * ratio * 100) / 100,
      Math.round(food.fat * ratio * 100) / 100,
      foodData.notes || null
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Update meal food
  static async updateMealFood(mealFoodId: string, updateData: UpdateMealFoodPayload): Promise<MealFood> {
    // Get current meal food and food details
    const currentQuery = `
      SELECT mf.*, f.* FROM meal_foods mf
      JOIN foods f ON mf.food_id = f.food_id
      WHERE mf.meal_food_id = $1
    `;
    const currentResult = await this.pool.query(currentQuery, [mealFoodId]);
    
    if (currentResult.rows.length === 0) {
      throw new Error('Meal food not found');
    }

    const current = currentResult.rows[0];
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.quantity !== undefined) {
      const ratio = updateData.quantity / current.serving_size;
      
      updateFields.push(`quantity = $${paramIndex++}`);
      values.push(updateData.quantity);
      
      updateFields.push(`calories_consumed = $${paramIndex++}`);
      values.push(Math.round(current.calories * ratio * 100) / 100);
      
      updateFields.push(`protein_consumed = $${paramIndex++}`);
      values.push(Math.round(current.protein * ratio * 100) / 100);
      
      updateFields.push(`carbs_consumed = $${paramIndex++}`);
      values.push(Math.round(current.carbs * ratio * 100) / 100);
      
      updateFields.push(`fat_consumed = $${paramIndex++}`);
      values.push(Math.round(current.fat * ratio * 100) / 100);
    }
    
    if (updateData.unit !== undefined) {
      updateFields.push(`unit = $${paramIndex++}`);
      values.push(updateData.unit);
    }
    
    if (updateData.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      values.push(updateData.notes);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(mealFoodId);

    const query = `
      UPDATE meal_foods 
      SET ${updateFields.join(', ')}
      WHERE meal_food_id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Remove food from meal
  static async removeFood(mealFoodId: string): Promise<void> {
    const query = 'DELETE FROM meal_foods WHERE meal_food_id = $1';
    await this.pool.query(query, [mealFoodId]);
  }

  // Get daily nutrition summary
  static async getDailyNutrition(userId: string, date: string): Promise<DailyNutritionSummary> {
    const mealsQuery = `
      SELECT * FROM meals 
      WHERE user_id = $1 AND meal_date = $2
      ORDER BY meal_time ASC, created_at ASC
    `;
    const mealsResult = await this.pool.query(mealsQuery, [userId, date]);

    const nutritionQuery = `
      SELECT 
        COALESCE(SUM(m.total_calories), 0) as total_calories,
        COALESCE(SUM(m.total_protein), 0) as total_protein,
        COALESCE(SUM(m.total_carbs), 0) as total_carbs,
        COALESCE(SUM(m.total_fat), 0) as total_fat,
        COALESCE(SUM(m.total_fiber), 0) as total_fiber,
        COALESCE(SUM(m.total_sugar), 0) as total_sugar,
        COUNT(m.meal_id) as meal_count
      FROM meals m
      WHERE m.user_id = $1 AND m.meal_date = $2
    `;
    const nutritionResult = await this.pool.query(nutritionQuery, [userId, date]);

    // Calculate additional nutrition info from meal_foods
    const detailedNutritionQuery = `
      SELECT 
        COALESCE(SUM(mf.calories_consumed), 0) as total_calories,
        COALESCE(SUM(mf.protein_consumed), 0) as total_protein,
        COALESCE(SUM(mf.carbs_consumed), 0) as total_carbs,
        COALESCE(SUM(mf.fat_consumed), 0) as total_fat,
        COALESCE(SUM(f.fiber * (mf.quantity / f.serving_size)), 0) as total_fiber,
        COALESCE(SUM(f.sugar * (mf.quantity / f.serving_size)), 0) as total_sugar,
        COALESCE(SUM(f.sodium * (mf.quantity / f.serving_size)), 0) as total_sodium,
        COALESCE(SUM(f.cholesterol * (mf.quantity / f.serving_size)), 0) as total_cholesterol
      FROM meals m
      JOIN meal_foods mf ON m.meal_id = mf.meal_id
      JOIN foods f ON mf.food_id = f.food_id
      WHERE m.user_id = $1 AND m.meal_date = $2
    `;
    const detailedResult = await this.pool.query(detailedNutritionQuery, [userId, date]);

    const nutritionData = nutritionResult.rows[0];
    const detailedData = detailedResult.rows[0];

    const totalCalories = parseFloat(detailedData.total_calories) || 0;
    const totalProtein = parseFloat(detailedData.total_protein) || 0;
    const totalCarbs = parseFloat(detailedData.total_carbs) || 0;
    const totalFat = parseFloat(detailedData.total_fat) || 0;
    const macroCalories = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9);

    return {
      date,
      meals: mealsResult.rows,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
      total_fiber: parseFloat(detailedData.total_fiber) || 0,
      total_sugar: parseFloat(detailedData.total_sugar) || 0,
      total_sodium: parseFloat(detailedData.total_sodium) || 0,
      total_cholesterol: parseFloat(detailedData.total_cholesterol) || 0,
      macro_breakdown: {
        protein_percentage: macroCalories > 0 ? (totalProtein * 4 / macroCalories) * 100 : 0,
        carbs_percentage: macroCalories > 0 ? (totalCarbs * 4 / macroCalories) * 100 : 0,
        fat_percentage: macroCalories > 0 ? (totalFat * 9 / macroCalories) * 100 : 0
      },
      meals_count: parseInt(nutritionData.meal_count) || 0
    };
  }

  // Get nutrition summary for date range
  static async getNutritionSummary(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<NutritionSummary> {
    const query = `
      SELECT 
        COALESCE(SUM(mf.calories_consumed), 0) as total_calories,
        COALESCE(SUM(mf.protein_consumed), 0) as total_protein,
        COALESCE(SUM(mf.carbs_consumed), 0) as total_carbs,
        COALESCE(SUM(mf.fat_consumed), 0) as total_fat,
        COALESCE(SUM(f.fiber * (mf.quantity / f.serving_size)), 0) as total_fiber,
        COALESCE(SUM(f.sugar * (mf.quantity / f.serving_size)), 0) as total_sugar,
        COALESCE(SUM(f.sodium * (mf.quantity / f.serving_size)), 0) as total_sodium,
        COALESCE(SUM(f.cholesterol * (mf.quantity / f.serving_size)), 0) as total_cholesterol,
        COUNT(DISTINCT m.meal_id) as meal_count
      FROM meals m
      JOIN meal_foods mf ON m.meal_id = mf.meal_id
      JOIN foods f ON mf.food_id = f.food_id
      WHERE m.user_id = $1 AND m.meal_date BETWEEN $2 AND $3
    `;
    
    const result = await this.pool.query(query, [userId, startDate, endDate]);
    const data = result.rows[0];

    return {
      total_calories: parseFloat(data.total_calories) || 0,
      total_protein: parseFloat(data.total_protein) || 0,
      total_carbs: parseFloat(data.total_carbs) || 0,
      total_fat: parseFloat(data.total_fat) || 0,
      total_fiber: parseFloat(data.total_fiber) || 0,
      total_sugar: parseFloat(data.total_sugar) || 0,
      total_sodium: parseFloat(data.total_sodium) || 0,
      total_cholesterol: parseFloat(data.total_cholesterol) || 0,
      macro_breakdown: {
        protein_percentage: ((parseFloat(data.total_protein) * 4) / ((parseFloat(data.total_calories) || 1))) * 100,
        carbs_percentage: ((parseFloat(data.total_carbs) * 4) / ((parseFloat(data.total_calories) || 1))) * 100,
        fat_percentage: ((parseFloat(data.total_fat) * 9) / ((parseFloat(data.total_calories) || 1))) * 100
      }
    };
  }

  // Check if user owns the meal
  static async isUserMeal(userId: string, mealId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM meals WHERE meal_id = $1 AND user_id = $2';
    const result = await this.pool.query(query, [mealId, userId]);
    return result.rows.length > 0;
  }

  // Check if user owns the meal food
  static async isUserMealFood(userId: string, mealFoodId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM meal_foods mf
      JOIN meals m ON mf.meal_id = m.meal_id
      WHERE mf.meal_food_id = $1 AND m.user_id = $2
    `;
    const result = await this.pool.query(query, [mealFoodId, userId]);
    return result.rows.length > 0;
  }
}