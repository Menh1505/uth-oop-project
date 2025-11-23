import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { ExerciseController } from '../controllers/ExerciseController';

const router = Router();

// Health check
router.get('/status', ExerciseController.status);

// Exercise CRUD routes (all require auth)
router.post('/', authenticate, ExerciseController.createExercise);
router.get('/:exerciseId', authenticate, ExerciseController.getExercise);
router.put('/:exerciseId', authenticate, ExerciseController.updateExercise);
router.delete('/:exerciseId', authenticate, ExerciseController.deleteExercise);

// Exercise query routes
router.get('/', authenticate, ExerciseController.getExercises);
router.get('/date/:date', authenticate, ExerciseController.getExercisesByDate);
router.get('/range/:startDate/:endDate', authenticate, ExerciseController.getExercisesByDateRange);

// Exercise analytics routes
router.get('/statistics/user', authenticate, ExerciseController.getExerciseStatistics);
router.get('/summary/daily/:date', authenticate, ExerciseController.getDailyExerciseSummary);
router.get('/performance/:exerciseName', authenticate, ExerciseController.getExercisePerformanceMetrics);

// Exercise recommendations and utilities
router.post('/recommendations', authenticate, ExerciseController.getExerciseRecommendations);
router.get('/popular/list', ExerciseController.getPopularExercises);
router.post('/calories/estimate', authenticate, ExerciseController.estimateCalories);

export default router;