import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler';
import MealRoutes from './routes/MealRoutes';
import logger from './config/logger';
import { connectDatabase } from './config/database';
import { seedSampleMeals } from './config/seed';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration: `${Date.now() - start}ms`,
      },
      '[meal-service] HTTP request'
    );
  });
  next();
});

app.use('/meals', MealRoutes);

app.get('/health', (_req, res) => {
  res.json({
    service: 'meal-service',
    status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use(errorHandler);

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  });
});

const startServer = async () => {
  try {
    await connectDatabase();
    await seedSampleMeals();

    app.listen(PORT, () => {
      logger.info(`Meal service running on port ${PORT}`);
      logger.info('Endpoints:');
      logger.info('- POST   /meals');
      logger.info('- GET    /meals/me?date=YYYY-MM-DD');
      logger.info('- PUT    /meals/:mealId');
      logger.info('- DELETE /meals/:mealId');
      logger.info('- GET    /meals/summary?date=YYYY-MM-DD');
    });
  } catch (error) {
    logger.error({ error }, '[meal-service] Failed to start server');
    process.exit(1);
  }
};

startServer();

export default app;
