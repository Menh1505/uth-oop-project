import { Request, Response } from 'express';
import { NutritionService } from '../services/NutritionService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class NutritionController {
  private nutritionService: NutritionService;

  constructor() {
    this.nutritionService = new NutritionService();
  }

  // ============= FOOD MANAGEMENT =============
  
  getFoods = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const filters = {
        category: req.query.category as any,
        brand: req.query.brand as string,
        search: req.query.search as string,
        barcode: req.query.barcode as string,
        isPublic: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
        maxCalories: req.query.maxCalories ? parseInt(req.query.maxCalories as string) : undefined,
        minProtein: req.query.minProtein ? parseInt(req.query.minProtein as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const foods = await this.nutritionService.getFoods(userId, filters);
      
      res.json({
        success: true,
        data: foods,
        count: foods.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get foods',
        message: error.message
      });
    }
  };

  getFood = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const food = await this.nutritionService.getFoodById(id, userId);
      
      if (!food) {
        return res.status(404).json({
          success: false,
          error: 'Food not found'
        });
      }

      res.json({
        success: true,
        data: food
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get food',
        message: error.message
      });
    }
  };

  createFood = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const foodData = req.body;

      const food = await this.nutritionService.createFood(userId, foodData);
      
      res.status(201).json({
        success: true,
        data: food,
        message: 'Food created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create food',
        message: error.message
      });
    }
  };

  updateFood = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updateData = req.body;

      const food = await this.nutritionService.updateFood(id, userId, updateData);
      
      if (!food) {
        return res.status(404).json({
          success: false,
          error: 'Food not found or not owned by user'
        });
      }

      res.json({
        success: true,
        data: food,
        message: 'Food updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update food',
        message: error.message
      });
    }
  };

  deleteFood = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const deleted = await this.nutritionService.deleteFood(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Food not found or not owned by user'
        });
      }

      res.json({
        success: true,
        message: 'Food deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete food',
        message: error.message
      });
    }
  };

  // ============= MEAL LOGGING =============
  
  getMealLogs = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const filters = {
        mealType: req.query.mealType as any,
        foodId: req.query.foodId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const mealLogs = await this.nutritionService.getUserMealLogs(userId, filters);
      
      res.json({
        success: true,
        data: mealLogs,
        count: mealLogs.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get meal logs',
        message: error.message
      });
    }
  };

  getMealLog = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const mealLog = await this.nutritionService.getMealLogById(id, userId);
      
      if (!mealLog) {
        return res.status(404).json({
          success: false,
          error: 'Meal log not found'
        });
      }

      res.json({
        success: true,
        data: mealLog
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get meal log',
        message: error.message
      });
    }
  };

  createMealLog = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const logData = req.body;

      const mealLog = await this.nutritionService.createMealLog(userId, logData);
      
      res.status(201).json({
        success: true,
        data: mealLog,
        message: 'Meal log created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create meal log',
        message: error.message
      });
    }
  };

  updateMealLog = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updateData = req.body;

      const mealLog = await this.nutritionService.updateMealLog(id, userId, updateData);
      
      if (!mealLog) {
        return res.status(404).json({
          success: false,
          error: 'Meal log not found'
        });
      }

      res.json({
        success: true,
        data: mealLog,
        message: 'Meal log updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update meal log',
        message: error.message
      });
    }
  };

  deleteMealLog = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const deleted = await this.nutritionService.deleteMealLog(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Meal log not found'
        });
      }

      res.json({
        success: true,
        message: 'Meal log deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete meal log',
        message: error.message
      });
    }
  };

  // ============= NUTRITION ANALYSIS =============
  
  getDailyNutrition = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const date = req.query.date as string || new Date().toISOString().split('T')[0];

      const summary = await this.nutritionService.getDailyNutritionSummary(userId, date);
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get daily nutrition',
        message: error.message
      });
    }
  };

  getWeeklyNutrition = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const startDate = req.query.startDate as string || new Date().toISOString().split('T')[0];

      const summary = await this.nutritionService.getWeeklyNutritionSummary(userId, startDate);
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get weekly nutrition',
        message: error.message
      });
    }
  };

  // ============= NUTRITION GOALS =============
  
  getNutritionGoals = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      const goals = await this.nutritionService.getUserNutritionGoals(userId);
      
      res.json({
        success: true,
        data: goals
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get nutrition goals',
        message: error.message
      });
    }
  };

  setNutritionGoals = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const goalsData = req.body;

      const goals = await this.nutritionService.setNutritionGoals(userId, goalsData);
      
      res.json({
        success: true,
        data: goals,
        message: 'Nutrition goals updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to set nutrition goals',
        message: error.message
      });
    }
  };

  // ============= HEALTH CHECK =============
  
  healthCheck = async (req: Request, res: Response) => {
    res.json({
      service: 'nutrition-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  };
}