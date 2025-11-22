import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { MealController } from '../controllers/MealController';

const router = Router();

// Health check (no auth needed)
router.get('/status', MealController.status);

// Meal query routes (specific routes BEFORE generic :mealId)
router.get('/date/:date', authenticate, MealController.getMealsByDate);
router.get('/range/:startDate/:endDate', authenticate, MealController.getMealsByDateRange);

// Meal CRUD routes (all require auth)
router.post('/', authenticate, MealController.createMeal);
router.get('/', authenticate, MealController.getMeals); // List meals
router.get('/:mealId', authenticate, MealController.getMeal);
router.put('/:mealId', authenticate, MealController.updateMeal);
router.delete('/:mealId', authenticate, MealController.deleteMeal);

// Meal food management routes
router.post('/:mealId/foods', authenticate, MealController.addFoodToMeal);
router.put('/foods/:mealFoodId', authenticate, MealController.updateMealFood);
router.delete('/foods/:mealFoodId', authenticate, MealController.removeFoodFromMeal);

// Nutrition analysis routes
router.get('/:mealId/analysis', authenticate, MealController.analyzeMealNutrition);

// Meal recommendations
router.post('/recommendations', authenticate, MealController.getMealRecommendations);

export default router;