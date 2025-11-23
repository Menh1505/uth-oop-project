import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { MealController } from '../controllers/MealController';

const router = Router();

router.get('/status', MealController.status);
router.get('/templates', MealController.getTemplates);
router.post('/', authenticate, MealController.createMeal);
router.get('/me', authenticate, MealController.getMyMeals);
router.put('/:mealId', authenticate, MealController.updateMeal);
router.delete('/:mealId', authenticate, MealController.deleteMeal);
router.get('/summary', authenticate, MealController.getDailySummary);

export default router;
