import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const orderController = new OrderController();

// Health check (public)
router.get('/health', orderController.healthCheck);

// Apply authentication middleware to all routes below
router.use(authMiddleware);

// ============= ORDER CRUD ROUTES =============
router.post('/', asyncHandler(orderController.createOrder));
router.get('/', asyncHandler(orderController.getUserOrders));
router.get('/:id', asyncHandler(orderController.getOrder));
router.put('/:id', asyncHandler(orderController.updateOrder));
router.delete('/:id', asyncHandler(orderController.deleteOrder));

// ============= ORDER STATUS MANAGEMENT ROUTES =============
router.put('/:id/status', asyncHandler(orderController.updateOrderStatus));
router.get('/:id/status-history', asyncHandler(orderController.getOrderStatusHistory));

// ============= QUICK STATUS ACTION ROUTES =============
router.post('/:id/cancel', asyncHandler(orderController.cancelOrder));
router.post('/:id/confirm', asyncHandler(orderController.confirmOrder));
router.post('/:id/ready', asyncHandler(orderController.markOrderReady));
router.post('/:id/delivered', asyncHandler(orderController.markOrderDelivered));

// ============= ANALYTICS ROUTES =============
router.get('/analytics/stats', asyncHandler(orderController.getOrderStats));

// ============= ADMIN ROUTES =============
// TODO: Add admin role middleware
router.get('/admin/all', asyncHandler(orderController.getAllOrders));
router.get('/admin/stats', asyncHandler(orderController.getGlobalOrderStats));

export default router;