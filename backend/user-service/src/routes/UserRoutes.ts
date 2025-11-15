import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { NewUserController } from '../controllers/UserController';

const router = Router();

// Health check
router.get('/status', NewUserController.status);

// Authentication routes (no auth required)
router.post('/register', NewUserController.register);
router.post('/login', NewUserController.login);

// User profile routes (auth required)
router.get('/me', authenticate, NewUserController.getMe);
router.put('/me', authenticate, NewUserController.updateMe);
router.put('/avatar', authenticate, NewUserController.uploadAvatar);

// Onboarding routes (auth required)
router.post('/onboarding', authenticate, NewUserController.completeOnboarding);

// Goals routes (auth required)
router.get('/goals/available', authenticate, NewUserController.getAvailableGoals);
router.get('/goals', authenticate, NewUserController.getUserGoals);
router.post('/goals', authenticate, NewUserController.assignGoal);
router.put('/goals/:goalId', authenticate, NewUserController.updateGoalProgress);
router.delete('/goals/:goalId', authenticate, NewUserController.removeGoal);

// Dashboard routes (auth required)
router.get('/dashboard', authenticate, NewUserController.getDashboard);

// Admin routes (auth + admin role required)
router.get('/admin/users', authenticate, NewUserController.listUsers);

// Legacy routes for backwards compatibility
router.get('/me-legacy', authenticate, NewUserController.legacyGetMe);
router.put('/me-legacy', authenticate, NewUserController.legacyUpdateMe);
router.put('/avatar-legacy', authenticate, NewUserController.legacyUploadAvatar);
router.get('/admin/users-legacy', authenticate, NewUserController.legacyListUsers);

export default router;