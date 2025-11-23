import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { MealService } from '../services/MealService';

export class MealController {
  // Health check
  static async status(_req: AuthRequest, res: Response) {
    res.json({
      service: 'meal-service',
      status: 'healthy',
      version: '1.0.0',
      database: process.env.DB_NAME || 'meal_db',
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /meals',
        'GET /meals/:mealId',
        'PUT /meals/:mealId',
        'DELETE /meals/:mealId',
        'GET /meals/date/:date',
        'GET /meals/range/:startDate/:endDate',
        'POST /meals/:mealId/foods',
        'PUT /meals/:mealId/foods/:mealFoodId',
        'DELETE /meals/:mealId/foods/:mealFoodId',
        'GET /nutrition/daily/:date',
        'GET /nutrition/range/:startDate/:endDate',
        'GET /meals/:mealId/analysis',
        'POST /meals/recommendations'
      ]
    });
  }

  // List all meals for user
  static async getMeals(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const meals = await MealService.getUserMeals(userId);
      
      res.json({
        success: true,
        count: meals?.length || 0,
        meals: meals || []
      });
    } catch (error: any) {
      console.error('Get meals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch meals',
        error: error.message
      });
    }
  }

  // Create new meal
  static async createMeal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const mealData = req.body;
      const meal = await MealService.createMeal(userId, mealData);
      
      res.status(201).json({
        success: true,
        message: 'Meal created successfully',
        meal
      });
    } catch (error: any) {
      console.error('Create meal error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create meal',
        error: error.message
      });
    }
  }

  // Get meal by ID
  static async getMeal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { mealId } = req.params;
      const meal = await MealService.getMealById(userId, mealId);
      
      if (!meal) {
        return res.status(404).json({
          success: false,
          message: 'Meal not found'
        });
      }

      res.json({
        success: true,
        meal
      });
    } catch (error: any) {
      console.error('Get meal error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch meal',
        error: error.message
      });
    }
  }

  // Update meal
  static async updateMeal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { mealId } = req.params;
      const updateData = req.body;
      
      const meal = await MealService.updateMeal(userId, mealId, updateData);
      
      res.json({
        success: true,
        message: 'Meal updated successfully',
        meal
      });
    } catch (error: any) {
      console.error('Update meal error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update meal',
        error: error.message
      });
    }
  }

  // Delete meal
  static async deleteMeal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { mealId } = req.params;
      await MealService.deleteMeal(userId, mealId);
      
      res.json({
        success: true,
        message: 'Meal deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete meal error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete meal',
        error: error.message
      });
    }
  }

  // Get meals by date
  static async getMealsByDate(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { date } = req.params;
      const meals = await MealService.getUserMealsByDate(userId, date);
      
      res.json({
        success: true,
        date,
        meals,
        count: meals.length
      });
    } catch (error: any) {
      console.error('Get meals by date error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch meals',
        error: error.message
      });
    }
  }

  // Get meals by date range
  static async getMealsByDateRange(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { startDate, endDate } = req.params;
      const meals = await MealService.getUserMealsByDateRange(userId, startDate, endDate);
      
      res.json({
        success: true,
        startDate,
        endDate,
        meals,
        count: meals.length
      });
    } catch (error: any) {
      console.error('Get meals by date range error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch meals',
        error: error.message
      });
    }
  }

  // Add food to meal
  static async addFoodToMeal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { mealId } = req.params;
      const foodData = req.body;
      
      await MealService.addFoodToMeal(userId, mealId, foodData);
      
      res.status(201).json({
        success: true,
        message: 'Food added to meal successfully'
      });
    } catch (error: any) {
      console.error('Add food to meal error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add food to meal',
        error: error.message
      });
    }
  }

  // Update meal food
  static async updateMealFood(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { mealFoodId } = req.params;
      const updateData = req.body;
      
      await MealService.updateMealFood(userId, mealFoodId, updateData);
      
      res.json({
        success: true,
        message: 'Meal food updated successfully'
      });
    } catch (error: any) {
      console.error('Update meal food error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update meal food',
        error: error.message
      });
    }
  }

  // Remove food from meal
  static async removeFoodFromMeal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { mealFoodId } = req.params;
      await MealService.removeFoodFromMeal(userId, mealFoodId);
      
      res.json({
        success: true,
        message: 'Food removed from meal successfully'
      });
    } catch (error: any) {
      console.error('Remove food from meal error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove food from meal',
        error: error.message
      });
    }
  }

  // Get daily nutrition
  static async getDailyNutrition(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { date } = req.params;
      const nutrition = await MealService.getDailyNutrition(userId, date);
      
      res.json({
        success: true,
        nutrition
      });
    } catch (error: any) {
      console.error('Get daily nutrition error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch daily nutrition',
        error: error.message
      });
    }
  }

  // Get nutrition summary for date range
  static async getNutritionSummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { startDate, endDate } = req.params;
      const nutrition = await MealService.getNutritionSummary(userId, startDate, endDate);
      
      res.json({
        success: true,
        startDate,
        endDate,
        nutrition
      });
    } catch (error: any) {
      console.error('Get nutrition summary error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch nutrition summary',
        error: error.message
      });
    }
  }

  // Analyze meal nutrition
  static async analyzeMealNutrition(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { mealId } = req.params;
      const analysis = await MealService.analyzeMealNutrition(userId, mealId);
      
      res.json({
        success: true,
        analysis
      });
    } catch (error: any) {
      console.error('Analyze meal nutrition error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to analyze meal nutrition',
        error: error.message
      });
    }
  }

  // Get meal recommendations
  static async getMealRecommendations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const criteria = req.body;
      const recommendations = await MealService.recommendMeals(userId, criteria);
      
      res.json({
        success: true,
        recommendations,
        count: recommendations.length
      });
    } catch (error: any) {
      console.error('Get meal recommendations error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get meal recommendations',
        error: error.message
      });
    }
  }
}