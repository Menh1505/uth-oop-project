import express from 'express';
import { RecommendationController } from '../controllers/RecommendationController';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for AI recommendations
const recommendationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each user to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many recommendation requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check
router.get('/health', RecommendationController.health);

// Get personalized recommendation
router.post('/generate', recommendationLimit, RecommendationController.getRecommendation);

// Get daily recommendation
router.get('/daily/:userId', RecommendationController.getDailyRecommendation);

// Get recommendation history
router.get('/history/:userId', RecommendationController.getRecommendationHistory);

export default router;