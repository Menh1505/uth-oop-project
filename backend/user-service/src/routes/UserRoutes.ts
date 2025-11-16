import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { UserController } from '../controllers/UserController';

const router = Router();

// User profile routes (auth required)
router.get('/me', authenticate, UserController.getMe);
router.put('/me', authenticate, UserController.updateMe);
router.put('/avatar', authenticate, UserController.uploadAvatar);

// Onboarding routes (auth required)
router.post('/onboarding', authenticate, UserController.completeOnboarding);

// Goals routes (auth required)
router.get('/goals/available', authenticate, UserController.getAvailableGoals);
router.get('/goals', authenticate, UserController.getUserGoals);
router.post('/goals', authenticate, UserController.assignGoal);
router.put('/goals/:goalId', authenticate, UserController.updateGoalProgress);
router.delete('/goals/:goalId', authenticate, UserController.removeGoal);

// Dashboard routes (auth required)
router.get('/dashboard', authenticate, UserController.getDashboard);

// Admin routes (auth + admin role required)
router.get('/admin/users', authenticate, UserController.listUsers);

export default router;