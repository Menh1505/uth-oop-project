import express, { Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import MealRoutes from './routes/MealRoutes';
import FoodRoutes from './routes/FoodRoutes';
import NutritionRoutes from './routes/NutritionRoutes';
import logger from './config/logger';

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/meals', MealRoutes);
app.use('/foods', FoodRoutes);
app.use('/nutrition', NutritionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'meal-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Meal service running on port ${PORT}`);
  logger.info('Available endpoints:');
  logger.info('- POST /meals - Create meal');
  logger.info('- GET /meals/:mealId - Get meal details');
  logger.info('- PUT /meals/:mealId - Update meal');
  logger.info('- DELETE /meals/:mealId - Delete meal');
  logger.info('- GET /meals/date/:date - Get meals by date');
  logger.info('- GET /meals/range/:startDate/:endDate - Get meals by date range');
  logger.info('- POST /meals/:mealId/foods - Add food to meal');
  logger.info('- PUT /meals/foods/:mealFoodId - Update meal food');
  logger.info('- DELETE /meals/foods/:mealFoodId - Remove food from meal');
  logger.info('- GET /meals/:mealId/analysis - Analyze meal nutrition');
  logger.info('- POST /meals/recommendations - Get meal recommendations');
  logger.info('- GET /foods - Search foods');
  logger.info('- POST /foods - Create food');
  logger.info('- GET /foods/:foodId - Get food details');
  logger.info('- PUT /foods/:foodId - Update food');
  logger.info('- DELETE /foods/:foodId - Delete food');
  logger.info('- GET /foods/category/:category - Get foods by category');
  logger.info('- GET /foods/categories/all - Get all categories');
  logger.info('- GET /foods/barcode/:barcode - Find food by barcode');
  logger.info('- GET /foods/popular/list - Get popular foods');
  logger.info('- GET /foods/recent/list - Get recent foods');
  logger.info('- POST /foods/:foodId/nutrition - Calculate nutrition for quantity');
  logger.info('- POST /foods/nutrition/compare - Compare nutrition between foods');
  logger.info('- GET /nutrition/daily/:date - Get daily nutrition summary');
  logger.info('- GET /nutrition/range/:startDate/:endDate - Get nutrition summary for range');
});

export default app;