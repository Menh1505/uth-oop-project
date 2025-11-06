import { Router } from 'express';
import { GatewayController } from '../controllers/GatewayController';
import { authMiddleware } from '../middleware/authMiddleware';
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware';

const router = Router();

// Health and observability endpoints (no auth required)
router.get('/health', GatewayController.healthCheck);
router.get('/metrics', GatewayController.getMetrics);
router.get('/info', GatewayController.getInfo);

// Apply middleware for all API routes
router.use('/api', rateLimitMiddleware);
router.use('/api', authMiddleware);

// Catch-all route for API requests - forward to appropriate service
router.all('/api/*', GatewayController.routeRequest);

export default router;