import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

router.post('/login', AuthController.login);
router.post('/admin/login', AuthController.adminLogin);
router.post('/register', AuthController.register);

// Logout requires authentication
router.post('/logout', AuthController.logout);

// Verify token
router.get('/verify', AuthController.verify);

// Simple status endpoint for testing
router.get('/status', (req, res) => {
  res.json({
    service: 'auth-service',
    status: 'healthy',
    version: '1.0.0',
    database: 'auth_db',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /login',
      'POST /admin/login',
      'POST /register',
      'POST /logout',
      'GET /verify',
      'GET /status'
    ]
  });
});

export default router;
