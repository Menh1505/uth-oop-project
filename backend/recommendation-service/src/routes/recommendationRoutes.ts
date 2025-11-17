import express from 'express';
import { RecommendationController } from '../controllers/RecommendationController';
import { checkPremiumSubscription } from '../middleware/premiumCheck';
import { authenticateToken } from '../middleware/authenticate';
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

// Health check (public)
router.get('/health', RecommendationController.health);

// Get personalized recommendation (premium only)
router.post('/generate', 
  recommendationLimit, 
  authenticateToken,
  checkPremiumSubscription,
  RecommendationController.getRecommendation
);

// Get daily recommendation (premium only)
router.get('/daily/:userId', 
  authenticateToken,
  checkPremiumSubscription,
  RecommendationController.getDailyRecommendation
);

// Get recommendation history (premium only)
router.get('/history/:userId', 
  authenticateToken,
  checkPremiumSubscription,
  RecommendationController.getRecommendationHistory
);

export default router;