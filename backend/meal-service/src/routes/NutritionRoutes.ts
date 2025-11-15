import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { MealController } from '../controllers/MealController';

const router = Router();

// Daily nutrition summary
router.get('/daily/:date', authenticate, MealController.getDailyNutrition);

// Nutrition summary for date range
router.get('/range/:startDate/:endDate', authenticate, MealController.getNutritionSummary);

export default router;