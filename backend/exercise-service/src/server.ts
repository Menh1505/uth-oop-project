import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import ExerciseRoutes from './routes/ExerciseRoutes';
import logger from './config/logger';

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/exercises', ExerciseRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'exercise-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Exercise service running on port ${PORT}`);
  logger.info('Available endpoints:');
  logger.info('- POST /exercises - Create exercise');
  logger.info('- GET /exercises/:exerciseId - Get exercise details');
  logger.info('- PUT /exercises/:exerciseId - Update exercise');
  logger.info('- DELETE /exercises/:exerciseId - Delete exercise');
  logger.info('- GET /exercises - Get exercises with filters');
  logger.info('- GET /exercises/date/:date - Get exercises by date');
  logger.info('- GET /exercises/range/:startDate/:endDate - Get exercises by date range');
  logger.info('- GET /exercises/statistics/user - Get exercise statistics');
  logger.info('- GET /exercises/summary/daily/:date - Get daily exercise summary');
  logger.info('- GET /exercises/performance/:exerciseName - Get exercise performance metrics');
  logger.info('- POST /exercises/recommendations - Get exercise recommendations');
  logger.info('- GET /exercises/popular/list - Get popular exercises');
  logger.info('- POST /exercises/calories/estimate - Estimate calories burned');
});

export default app;