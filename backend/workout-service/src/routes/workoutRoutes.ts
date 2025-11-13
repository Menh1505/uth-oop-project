import { Router } from 'express';
import { WorkoutController } from '../controllers/WorkoutController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const workoutController = new WorkoutController();

// Health check
router.get('/health', workoutController.healthCheck);

// All routes require authentication
router.use(authMiddleware);

// ============= WORKOUT PLANS =============
router.get('/plans', workoutController.getUserWorkoutPlans);
router.get('/plans/:id', workoutController.getWorkoutPlan);
router.post('/plans', workoutController.createWorkoutPlan);
router.put('/plans/:id', workoutController.updateWorkoutPlan);
router.delete('/plans/:id', workoutController.deleteWorkoutPlan);

// ============= EXERCISES =============
router.get('/exercises', workoutController.getUserExercises);
router.get('/exercises/:id', workoutController.getExercise);
router.post('/exercises', workoutController.createExercise);
router.put('/exercises/:id', workoutController.updateExercise);
router.delete('/exercises/:id', workoutController.deleteExercise);

// ============= WORKOUT LOGS =============
router.get('/logs', workoutController.getUserWorkoutLogs);
router.get('/logs/:id', workoutController.getWorkoutLog);
router.post('/logs', workoutController.createWorkoutLog);
router.put('/logs/:id', workoutController.updateWorkoutLog);
router.delete('/logs/:id', workoutController.deleteWorkoutLog);

// ============= STATS & ANALYTICS =============
router.get('/stats', workoutController.getUserStats);

export default router;