import pool from '../config/database';
import { UserProfile, UserGoal, RecentMeal, RecentExercise } from '../models/types';
import logger from '../config/logger';

export class UserDataService {
  
  static async getUserProfile(userId: number): Promise<UserProfile | null> {
    try {
      const query = `
        SELECT 
          user_id, email, first_name, last_name, 
          date_of_birth, gender, height_cm, weight_kg,
          activity_level, dietary_preferences, allergies,
          health_conditions, subscription_type
        FROM users 
        WHERE user_id = $1 AND is_active = true
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      
      // Calculate age from date_of_birth
      let age: number | undefined;
      if (user.date_of_birth) {
        const today = new Date();
        const birthDate = new Date(user.date_of_birth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }
      
      return {
        ...user,
        age
      };
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  static async getUserGoals(userId: number): Promise<UserGoal[]> {
    try {
      const query = `
        SELECT 
          g.goal_id, g.goal_type, g.target_calories,
          g.target_protein, g.target_carbs, g.target_fat,
          g.description, ug.is_active
        FROM goals g
        JOIN user_goals ug ON g.goal_id = ug.goal_id
        WHERE ug.user_id = $1
        ORDER BY ug.created_at DESC
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching user goals:', error);
      throw new Error('Failed to fetch user goals');
    }
  }

  static async getRecentMeals(userId: number, days: number = 7): Promise<RecentMeal[]> {
    try {
      const query = `
        SELECT 
          m.meal_id, m.meal_type, m.meal_date, m.calorie_intake,
          json_agg(
            json_build_object(
              'food_name', f.food_name,
              'quantity', mf.quantity,
              'calories', mf.calories,
              'protein', mf.protein,
              'carbs', mf.carbs,
              'fat', mf.fat
            )
          ) as foods
        FROM meals m
        LEFT JOIN meal_foods mf ON m.meal_id = mf.meal_id
        LEFT JOIN foods f ON mf.food_id = f.food_id
        WHERE m.user_id = $1 
          AND m.meal_date >= CURRENT_DATE - INTERVAL '$2 days'
        GROUP BY m.meal_id, m.meal_type, m.meal_date, m.calorie_intake
        ORDER BY m.meal_date DESC, m.meal_id DESC
        LIMIT 20
      `;
      
      const result = await pool.query(query, [userId, days]);
      return result.rows.map((row: any) => ({
        ...row,
        foods: row.foods || []
      }));
    } catch (error) {
      logger.error('Error fetching recent meals:', error);
      throw new Error('Failed to fetch recent meals');
    }
  }

  static async getRecentExercises(userId: number, days: number = 7): Promise<RecentExercise[]> {
    try {
      const query = `
        SELECT 
          exercise_id, exercise_name, duration_minutes,
          calories_burned, intensity, created_at as exercise_date
        FROM exercises 
        WHERE user_id = $1 
          AND created_at >= CURRENT_DATE - INTERVAL '$2 days'
        ORDER BY created_at DESC
        LIMIT 15
      `;
      
      const result = await pool.query(query, [userId, days]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching recent exercises:', error);
      throw new Error('Failed to fetch recent exercises');
    }
  }

  static async getAllUserData(userId: number) {
    try {
      const [profile, goals, recentMeals, recentExercises] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserGoals(userId),
        this.getRecentMeals(userId),
        this.getRecentExercises(userId)
      ]);

      if (!profile) {
        throw new Error('User not found');
      }

      return {
        user: profile,
        goals,
        recent_meals: recentMeals,
        recent_exercises: recentExercises
      };
    } catch (error) {
      logger.error('Error fetching all user data:', error);
      throw error;
    }
  }
}