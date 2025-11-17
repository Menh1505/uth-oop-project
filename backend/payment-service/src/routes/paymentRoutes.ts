import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticateToken } from '../middleware/authenticate';

const router: ExpressRouter = Router();
const paymentController = new PaymentController();

// Public routes
router.get('/health', paymentController.healthCheck);
router.get('/plans', paymentController.getSubscriptionPlans);

// Protected routes
router.get('/user/:userId/subscription', authenticateToken, paymentController.checkSubscription);
router.post('/user/:userId/payment', authenticateToken, paymentController.createPayment);
router.get('/user/:userId/payments', authenticateToken, paymentController.getPaymentHistory);
router.delete('/user/:userId/subscription', authenticateToken, paymentController.cancelSubscription);

export default router;