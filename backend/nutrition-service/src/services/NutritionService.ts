import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { 
  Food, 
  CreateFoodRequest, 
  UpdateFoodRequest,
  FoodSearchFilters 
} from '../models/Food';
import { 
  MealLog, 
  MealLogWithDetails,
  CreateMealLogRequest, 
  UpdateMealLogRequest,
  MealLogSearchFilters 
} from '../models/MealLog';
import { 
  DailyNutritionSummary,
  WeeklyNutritionSummary,
  NutritionGoals,
  CreateNutritionGoalsRequest,
  UpdateNutritionGoalsRequest,
  MacroDistribution,
  NutritionInsight
} from '../models/NutritionAnalysis';

export class NutritionService {
  
  // ============= FOOD MANAGEMENT =============
  
  async getFoods(userId: string, filters: FoodSearchFilters = {}): Promise<Food[]> {
    try {
      let query = `
        SELECT * FROM foods 
        WHERE (created_by = $1 OR is_public = true)
      `;
      const values: any[] = [userId];
      let paramCount = 1;

      if (filters.category) {
        query += ` AND category = $${++paramCount}`;
        values.push(filters.category);
      }

      if (filters.brand) {
        query += ` AND brand ILIKE $${++paramCount}`;
        values.push(`%${filters.brand}%`);
      }

      if (filters.search) {
        query += ` AND (name ILIKE $${++paramCount} OR brand ILIKE $${++paramCount})`;
        values.push(`%${filters.search}%`, `%${filters.search}%`);
        paramCount++;
      }

      if (filters.barcode) {
        query += ` AND barcode = $${++paramCount}`;
        values.push(filters.barcode);
      }

      if (filters.maxCalories) {
        query += ` AND (nutrition_per_100g->>'calories')::numeric <= $${++paramCount}`;
        values.push(filters.maxCalories);
      }

      if (filters.minProtein) {
        query += ` AND (nutrition_per_100g->>'protein')::numeric >= $${++paramCount}`;
        values.push(filters.minProtein);
      }

      if (filters.isPublic !== undefined) {
        query += ` AND is_public = $${++paramCount}`;
        values.push(filters.isPublic);
      }

      query += ` ORDER BY name ASC`;

      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`;
        values.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${++paramCount}`;
        values.push(filters.offset);
      }

      const result = await pool.query(query, values);
      return result.rows.map(this.mapRowToFood);
    } catch (error) {
      throw error;
    }
  }

  async getFoodById(id: string, userId: string): Promise<Food | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM foods WHERE id = $1 AND (created_by = $2 OR is_public = true)',
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToFood(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async createFood(userId: string, data: CreateFoodRequest): Promise<Food> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const result = await pool.query(`
        INSERT INTO foods (
          id, name, brand, category, serving_size, serving_unit, 
          nutrition_per_100g, barcode, is_verified, created_by, 
          is_public, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        id, data.name, data.brand, data.category, data.servingSize, 
        data.servingUnit, JSON.stringify(data.nutritionPer100g), 
        data.barcode, false, userId, data.isPublic || false, now, now
      ]);

      return this.mapRowToFood(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async updateFood(id: string, userId: string, data: UpdateFoodRequest): Promise<Food | null> {
    try {
      // Only allow updating own foods
      const existing = await pool.query(
        'SELECT * FROM foods WHERE id = $1 AND created_by = $2',
        [id, userId]
      );
      
      if (existing.rows.length === 0) {
        return null;
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const fieldsToUpdate = [
        'name', 'brand', 'category', 'servingSize', 'servingUnit',
        'nutritionPer100g', 'barcode', 'isPublic'
      ];

      fieldsToUpdate.forEach(field => {
        const dbField = field === 'servingSize' ? 'serving_size' :
                       field === 'servingUnit' ? 'serving_unit' :
                       field === 'nutritionPer100g' ? 'nutrition_per_100g' :
                       field === 'isPublic' ? 'is_public' :
                       field.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (data[field as keyof UpdateFoodRequest] !== undefined) {
          updateFields.push(`${dbField} = $${++paramCount}`);
          let value = data[field as keyof UpdateFoodRequest];
          if (field === 'nutritionPer100g') {
            value = JSON.stringify(value);
          }
          values.push(value);
        }
      });

      if (updateFields.length === 0) {
        return this.mapRowToFood(existing.rows[0]);
      }

      updateFields.push(`updated_at = $${++paramCount}`);
      values.push(new Date());
      values.push(id);
      values.push(userId);

      const result = await pool.query(`
        UPDATE foods SET ${updateFields.join(', ')} 
        WHERE id = $${++paramCount} AND created_by = $${++paramCount}
        RETURNING *
      `, values);

      return this.mapRowToFood(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async deleteFood(id: string, userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM foods WHERE id = $1 AND created_by = $2', 
        [id, userId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // ============= MEAL LOGGING =============
  
  async getUserMealLogs(userId: string, filters: MealLogSearchFilters = {}): Promise<MealLogWithDetails[]> {
    try {
      let query = `
        SELECT ml.*, f.name as food_name, f.brand as food_brand, 
               f.nutrition_per_100g, f.serving_size, f.serving_unit
        FROM meal_logs ml
        JOIN foods f ON ml.food_id = f.id
        WHERE ml.user_id = $1
      `;
      const values: any[] = [userId];
      let paramCount = 1;

      if (filters.mealType) {
        query += ` AND ml.meal_type = $${++paramCount}`;
        values.push(filters.mealType);
      }

      if (filters.foodId) {
        query += ` AND ml.food_id = $${++paramCount}`;
        values.push(filters.foodId);
      }

      if (filters.startDate) {
        query += ` AND ml.date >= $${++paramCount}`;
        values.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND ml.date <= $${++paramCount}`;
        values.push(filters.endDate);
      }

      query += ` ORDER BY ml.date DESC, ml.created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`;
        values.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${++paramCount}`;
        values.push(filters.offset);
      }

      const result = await pool.query(query, values);
      return result.rows.map(this.mapRowToMealLogWithDetails);
    } catch (error) {
      throw error;
    }
  }

  async getMealLogById(id: string, userId: string): Promise<MealLogWithDetails | null> {
    try {
      const result = await pool.query(`
        SELECT ml.*, f.name as food_name, f.brand as food_brand, 
               f.nutrition_per_100g, f.serving_size, f.serving_unit
        FROM meal_logs ml
        JOIN foods f ON ml.food_id = f.id
        WHERE ml.id = $1 AND ml.user_id = $2
      `, [id, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToMealLogWithDetails(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async createMealLog(userId: string, data: CreateMealLogRequest): Promise<MealLogWithDetails> {
    try {
      const id = uuidv4();
      const now = new Date();
      const logDate = data.date || now;
      
      const result = await pool.query(`
        INSERT INTO meal_logs (
          id, user_id, food_id, meal_type, quantity, unit, date, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        id, userId, data.foodId, data.mealType, data.quantity, 
        data.unit, logDate, data.notes, now, now
      ]);

      // Get the meal log with food details
      const mealLog = await this.getMealLogById(id, userId);
      return mealLog!;
    } catch (error) {
      throw error;
    }
  }

  async updateMealLog(id: string, userId: string, data: UpdateMealLogRequest): Promise<MealLogWithDetails | null> {
    try {
      const existing = await pool.query(
        'SELECT * FROM meal_logs WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (existing.rows.length === 0) {
        return null;
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const fieldsToUpdate = ['mealType', 'quantity', 'unit', 'date', 'notes'];

      fieldsToUpdate.forEach(field => {
        const dbField = field === 'mealType' ? 'meal_type' :
                       field.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (data[field as keyof UpdateMealLogRequest] !== undefined) {
          updateFields.push(`${dbField} = $${++paramCount}`);
          values.push(data[field as keyof UpdateMealLogRequest]);
        }
      });

      if (updateFields.length === 0) {
        return await this.getMealLogById(id, userId);
      }

      updateFields.push(`updated_at = $${++paramCount}`);
      values.push(new Date());
      values.push(id);
      values.push(userId);

      await pool.query(`
        UPDATE meal_logs SET ${updateFields.join(', ')} 
        WHERE id = $${++paramCount} AND user_id = $${++paramCount}
      `, values);

      return await this.getMealLogById(id, userId);
    } catch (error) {
      throw error;
    }
  }

  async deleteMealLog(id: string, userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM meal_logs WHERE id = $1 AND user_id = $2', 
        [id, userId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // ============= NUTRITION ANALYSIS =============
  
  async getDailyNutritionSummary(userId: string, date: string): Promise<DailyNutritionSummary> {
    try {
      // Get all meal logs for the specific date
      const mealLogs = await this.getUserMealLogs(userId, {
        startDate: new Date(date),
        endDate: new Date(date + 'T23:59:59')
      });

      // Calculate totals
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbohydrates = 0;
      let totalFat = 0;
      let totalFiber = 0;
      let totalSugar = 0;
      let totalSodium = 0;

      const mealBreakdown: any = {};

      mealLogs.forEach(log => {
        const nutrition = log.calculatedNutrition;
        
        totalCalories += nutrition.calories;
        totalProtein += nutrition.protein;
        totalCarbohydrates += nutrition.carbohydrates;
        totalFat += nutrition.fat;
        totalFiber += nutrition.fiber || 0;
        totalSugar += nutrition.sugar || 0;
        totalSodium += nutrition.sodium || 0;

        // Group by meal type
        if (!mealBreakdown[log.mealType]) {
          mealBreakdown[log.mealType] = {
            mealType: log.mealType,
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            foods: []
          };
        }

        mealBreakdown[log.mealType].calories += nutrition.calories;
        mealBreakdown[log.mealType].protein += nutrition.protein;
        mealBreakdown[log.mealType].carbohydrates += nutrition.carbohydrates;
        mealBreakdown[log.mealType].fat += nutrition.fat;

        mealBreakdown[log.mealType].foods.push({
          foodName: log.foodName,
          quantity: log.quantity,
          unit: log.unit,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbohydrates: nutrition.carbohydrates,
          fat: nutrition.fat
        });
      });

      // Get user's nutrition goals
      const goals = await this.getUserNutritionGoals(userId);

      return {
        date,
        totalCalories,
        totalProtein,
        totalCarbohydrates,
        totalFat,
        totalFiber,
        totalSugar,
        totalSodium,
        mealBreakdown: Object.values(mealBreakdown),
        recommendedIntake: this.getRecommendedIntake(), // Default recommendations
        nutritionGoals: goals,
        achievements: this.calculateAchievements(
          { totalCalories, totalProtein, totalCarbohydrates, totalFat, totalFiber },
          goals
        )
      };
    } catch (error) {
      throw error;
    }
  }

  async getWeeklyNutritionSummary(userId: string, startDate: string): Promise<WeeklyNutritionSummary> {
    try {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const dailySummaries: DailyNutritionSummary[] = [];
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        const dailySummary = await this.getDailyNutritionSummary(userId, dateStr);
        dailySummaries.push(dailySummary);
      }

      // Calculate averages
      const totalCalories = dailySummaries.reduce((sum, day) => sum + day.totalCalories, 0);
      const totalProtein = dailySummaries.reduce((sum, day) => sum + day.totalProtein, 0);
      const totalCarbs = dailySummaries.reduce((sum, day) => sum + day.totalCarbohydrates, 0);
      const totalFat = dailySummaries.reduce((sum, day) => sum + day.totalFat, 0);

      return {
        weekStartDate: startDate,
        weekEndDate: endDate.toISOString().split('T')[0],
        averageDailyCalories: Math.round(totalCalories / 7),
        averageDailyProtein: Math.round(totalProtein / 7),
        averageDailyCarbs: Math.round(totalCarbs / 7),
        averageDailyFat: Math.round(totalFat / 7),
        totalCalories,
        dailySummaries,
        trends: [] // Could be implemented for trend analysis
      };
    } catch (error) {
      throw error;
    }
  }

  // ============= NUTRITION GOALS =============
  
  async getUserNutritionGoals(userId: string): Promise<NutritionGoals> {
    try {
      const result = await pool.query(
        'SELECT * FROM nutrition_goals WHERE user_id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        // Return default goals
        return {
          calorieGoal: 2000,
          proteinGoal: 150,
          carbGoal: 250,
          fatGoal: 65,
          waterGoal: 2000
        };
      }
      
      return this.mapRowToNutritionGoals(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async setNutritionGoals(userId: string, data: CreateNutritionGoalsRequest): Promise<NutritionGoals> {
    try {
      const now = new Date();
      
      const result = await pool.query(`
        INSERT INTO nutrition_goals (
          user_id, calorie_goal, protein_goal, carb_goal, fat_goal, water_goal, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          calorie_goal = EXCLUDED.calorie_goal,
          protein_goal = EXCLUDED.protein_goal,
          carb_goal = EXCLUDED.carb_goal,
          fat_goal = EXCLUDED.fat_goal,
          water_goal = EXCLUDED.water_goal,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `, [
        userId, data.calorieGoal, data.proteinGoal, 
        data.carbGoal, data.fatGoal, data.waterGoal, now, now
      ]);

      return this.mapRowToNutritionGoals(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // ============= HELPER METHODS =============

  private calculateNutrition(foodNutrition: any, quantity: number, servingSize: number) {
    const factor = quantity / servingSize;
    
    return {
      calories: Math.round((foodNutrition.calories || 0) * factor),
      protein: Math.round((foodNutrition.protein || 0) * factor * 10) / 10,
      carbohydrates: Math.round((foodNutrition.carbohydrates || 0) * factor * 10) / 10,
      fat: Math.round((foodNutrition.fat || 0) * factor * 10) / 10,
      fiber: Math.round((foodNutrition.fiber || 0) * factor * 10) / 10,
      sugar: Math.round((foodNutrition.sugar || 0) * factor * 10) / 10,
      sodium: Math.round((foodNutrition.sodium || 0) * factor),
      cholesterol: Math.round((foodNutrition.cholesterol || 0) * factor),
      vitaminA: Math.round((foodNutrition.vitaminA || 0) * factor),
      vitaminC: Math.round((foodNutrition.vitaminC || 0) * factor),
      calcium: Math.round((foodNutrition.calcium || 0) * factor),
      iron: Math.round((foodNutrition.iron || 0) * factor * 10) / 10
    };
  }

  private getRecommendedIntake() {
    return {
      calories: 2000,
      protein: 150,
      carbohydrates: 250,
      fat: 65,
      fiber: 25,
      sodium: 2300
    };
  }

  private calculateAchievements(nutrition: any, goals: NutritionGoals) {
    const achievements = [];
    
    // Calorie goal achievement
    const caloriePercentage = Math.round((nutrition.totalCalories / goals.calorieGoal) * 100);
    achievements.push({
      type: 'calorie_goal' as const,
      achieved: caloriePercentage >= 95 && caloriePercentage <= 105,
      percentage: caloriePercentage,
      description: `${caloriePercentage}% of calorie goal (${nutrition.totalCalories}/${goals.calorieGoal})`
    });

    // Protein goal achievement
    const proteinPercentage = Math.round((nutrition.totalProtein / goals.proteinGoal) * 100);
    achievements.push({
      type: 'protein_goal' as const,
      achieved: proteinPercentage >= 90,
      percentage: proteinPercentage,
      description: `${proteinPercentage}% of protein goal (${nutrition.totalProtein}g/${goals.proteinGoal}g)`
    });

    return achievements;
  }

  private mapRowToFood(row: any): Food {
    return {
      id: row.id,
      name: row.name,
      brand: row.brand,
      category: row.category,
      servingSize: row.serving_size,
      servingUnit: row.serving_unit,
      nutritionPer100g: row.nutrition_per_100g,
      barcode: row.barcode,
      isVerified: row.is_verified,
      createdBy: row.created_by,
      isPublic: row.is_public,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToMealLogWithDetails(row: any): MealLogWithDetails {
    const calculatedNutrition = this.calculateNutrition(
      row.nutrition_per_100g, 
      row.quantity, 
      row.serving_size
    );

    return {
      id: row.id,
      userId: row.user_id,
      foodId: row.food_id,
      mealType: row.meal_type,
      quantity: row.quantity,
      unit: row.unit,
      date: row.date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      foodName: row.food_name,
      foodBrand: row.food_brand,
      calculatedNutrition
    };
  }

  private mapRowToNutritionGoals(row: any): NutritionGoals {
    return {
      calorieGoal: row.calorie_goal,
      proteinGoal: row.protein_goal,
      carbGoal: row.carb_goal,
      fatGoal: row.fat_goal,
      waterGoal: row.water_goal
    };
  }
}