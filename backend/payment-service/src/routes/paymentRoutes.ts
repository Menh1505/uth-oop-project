import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
const paymentController = new PaymentController();

// ============= HEALTH CHECK =============
router.get('/health', paymentController.healthCheck);

// ============= PAYMENT CRUD ROUTES =============
router.post('/payments', authenticateToken, paymentController.createPayment);
router.get('/payments/:id', authenticateToken, paymentController.getPayment);
router.get('/payments', authenticateToken, paymentController.getUserPayments);
router.put('/payments/:id', authenticateToken, paymentController.updatePayment);
router.delete('/payments/:id', authenticateToken, paymentController.cancelPayment);

// ============= REFUND ROUTES =============
router.post('/refunds', authenticateToken, paymentController.createRefund);

// ============= APPLE PAY ROUTES =============
router.post('/apple-pay', authenticateToken, paymentController.createApplePayPayment);

// ============= PAYOS ROUTES =============
router.post('/payos', authenticateToken, paymentController.createPayOSPayment);

// ============= MOCK PAYMENT ROUTES (FOR TESTING) =============
router.post('/mock', authenticateToken, paymentController.createMockPayment);

// ============= WEBHOOK ROUTES =============
router.post('/webhooks/apple-pay', paymentController.handleapplePayWebhook);
router.post('/webhooks/payos', paymentController.handlePayOSWebhook);
router.post('/webhooks/mock', paymentController.handleMockWebhook);

// ============= ANALYTICS ROUTES =============
router.get('/stats', authenticateToken, paymentController.getPaymentStats);

// ============= ADMIN ROUTES =============
router.get('/admin/payments', authenticateToken, requireAdmin, paymentController.getAllPayments);
router.get('/admin/stats', authenticateToken, requireAdmin, paymentController.getGlobalPaymentStats);

export default router;