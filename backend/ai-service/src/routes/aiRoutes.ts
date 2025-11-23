import { Router } from 'express';
import { AIController } from '../controllers/AIController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Health check (no auth required)
router.get('/status', AIController.status);

// Protected routes (require authentication)
router.post('/nutrition-advice', authenticate, AIController.getNutritionAdvice);
router.post('/ask-coach', authenticate, AIController.askCoach);

export default router;