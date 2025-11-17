import express, { Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import GoalRoutes from './routes/GoalRoutes';
import logger from './config/logger';

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/goals', GoalRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: 'goal-service',
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
  logger.info(`Goal service running on port ${PORT}`);
  logger.info('Available endpoints:');
  logger.info('- POST /goals - Create goal (Admin)');
  logger.info('- GET /goals/:goalId - Get goal details');
  logger.info('- PUT /goals/:goalId - Update goal (Admin)');
  logger.info('- DELETE /goals/:goalId - Delete goal (Admin)');
  logger.info('- GET /goals - Get goals with filters');
  logger.info('- GET /goals/popular/list - Get popular goals');
  logger.info('- POST /goals/user-goals - Assign goal to user');
  logger.info('- GET /goals/user-goals - Get user goals');
  logger.info('- GET /goals/user-goals/:userGoalId - Get user goal details');
  logger.info('- PUT /goals/user-goals/:userGoalId - Update user goal');
  logger.info('- DELETE /goals/user-goals/:userGoalId - Delete user goal');
  logger.info('- GET /goals/user-goals/:userGoalId/progress - Get goal progress');
  logger.info('- PUT /goals/user-goals/:userGoalId/progress - Update goal progress');
  logger.info('- GET /goals/statistics/user - Get user goal statistics');
  logger.info('- GET /goals/deadline/near - Get goals near deadline');
  logger.info('- GET /goals/activity/recent - Get recent goal activity');
  logger.info('- GET /goals/recommendations/goals - Get goal recommendations');
  logger.info('- GET /goals/user-goals/:userGoalId/suggestions - Get adjustment suggestions');
  logger.info('- GET /goals/templates/list - Get goal templates');
  logger.info('- POST /goals/templates/:templateId/create - Create goal from template');
  logger.info('- GET /goals/suggestions/smart - Get smart goal suggestions');
});

export default app;