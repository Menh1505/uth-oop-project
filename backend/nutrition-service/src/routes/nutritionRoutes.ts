import { Router } from 'express';
import { NutritionController } from '../controllers/NutritionController';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const nutritionController = new NutritionController();

// Health check
router.get('/health', nutritionController.healthCheck);

// Apply authentication middleware to all routes below
router.use(authMiddleware);

// ============= FOOD ROUTES =============
router.get('/foods', asyncHandler(nutritionController.getFoods));
router.get('/foods/:id', asyncHandler(nutritionController.getFood));
router.post('/foods', asyncHandler(nutritionController.createFood));
router.put('/foods/:id', asyncHandler(nutritionController.updateFood));
router.delete('/foods/:id', asyncHandler(nutritionController.deleteFood));

// ============= MEAL LOG ROUTES =============
router.get('/meal-logs', asyncHandler(nutritionController.getMealLogs));
router.get('/meal-logs/:id', asyncHandler(nutritionController.getMealLog));
router.post('/meal-logs', asyncHandler(nutritionController.createMealLog));
router.put('/meal-logs/:id', asyncHandler(nutritionController.updateMealLog));
router.delete('/meal-logs/:id', asyncHandler(nutritionController.deleteMealLog));

// ============= NUTRITION ANALYSIS ROUTES =============
router.get('/analysis/daily', asyncHandler(nutritionController.getDailyNutrition));
router.get('/analysis/weekly', asyncHandler(nutritionController.getWeeklyNutrition));

// ============= NUTRITION GOALS ROUTES =============
router.get('/goals', asyncHandler(nutritionController.getNutritionGoals));
router.post('/goals', asyncHandler(nutritionController.setNutritionGoals));
router.put('/goals', asyncHandler(nutritionController.setNutritionGoals));

export default router;