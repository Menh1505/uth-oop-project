import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticateAdmin } from '../middleware/adminMiddleware';

const router = Router();

// Simple status endpoint for testing (public)
router.get('/status', (req, res) => {
  res.json({
    service: 'admin-service',
    status: 'healthy',
    version: '1.0.0',
    database: 'admin_db',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /system/info',
      'GET /system/health',
      'GET /users',
      'GET /stats',
      'GET /status'
    ]
  });
});

// All admin routes require admin authentication
router.use(authenticateAdmin);

router.get('/system/info', AdminController.getSystemInfo);
router.get('/system/health', AdminController.getServiceHealth);
router.get('/users', AdminController.getUsers);
router.delete('/users/:userId', AdminController.deleteUser);
router.get('/stats', AdminController.getAdminStats);

export default router;
