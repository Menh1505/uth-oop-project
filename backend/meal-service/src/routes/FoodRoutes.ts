import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { FoodController } from '../controllers/FoodController';

const router = Router();

// Food search and discovery routes (specific paths BEFORE generic :foodId)
router.get('/categories/all', authenticate, FoodController.getFoodCategories);
router.get('/category/:category', authenticate, FoodController.getFoodsByCategory);
router.get('/barcode/:barcode', authenticate, FoodController.findFoodByBarcode);
router.get('/popular/list', authenticate, FoodController.getPopularFoods);
router.get('/recent/list', authenticate, FoodController.getRecentFoods);

// Nutrition calculation routes
router.post('/nutrition/compare', authenticate, FoodController.compareNutrition);
router.post('/:foodId/nutrition', authenticate, FoodController.calculateNutrition);

// Food CRUD routes
router.post('/', authenticate, FoodController.createFood);
router.get('/', authenticate, FoodController.searchFoods);
router.get('/:foodId', authenticate, FoodController.getFood);
router.put('/:foodId', authenticate, FoodController.updateFood);
router.delete('/:foodId', authenticate, FoodController.deleteFood);

export default router;