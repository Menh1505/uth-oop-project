import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import nutritionRoutes from './routes/nutritionRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// ============= MIDDLEWARE =============
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============= ROUTES =============
app.use('/api/nutrition', nutritionRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'nutrition-service',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/nutrition/health',
      foods: {
        list: 'GET /api/nutrition/foods',
        get: 'GET /api/nutrition/foods/:id',
        create: 'POST /api/nutrition/foods',
        update: 'PUT /api/nutrition/foods/:id',
        delete: 'DELETE /api/nutrition/foods/:id'
      },
      mealLogs: {
        list: 'GET /api/nutrition/meal-logs',
        get: 'GET /api/nutrition/meal-logs/:id',
        create: 'POST /api/nutrition/meal-logs',
        update: 'PUT /api/nutrition/meal-logs/:id',
        delete: 'DELETE /api/nutrition/meal-logs/:id'
      },
      analysis: {
        daily: 'GET /api/nutrition/analysis/daily',
        weekly: 'GET /api/nutrition/analysis/weekly'
      },
      goals: {
        get: 'GET /api/nutrition/goals',
        set: 'POST /api/nutrition/goals',
        update: 'PUT /api/nutrition/goals'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ============= ERROR HANDLING =============
app.use(notFoundHandler);
app.use(errorHandler);

export default app;