import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

router.get('/health', AuthController.health);
router.get('/status', (_req, res) => {
  res.json({
    service: 'auth-service',
    status: 'healthy',
    version: '1.1.0',
    database: process.env.DB_NAME || 'auth_db',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /auth/register',
      'POST /auth/login',
      'POST /auth/admin/login',
      'POST /auth/refresh',
      'POST /auth/logout',
      'GET  /auth/verify',
      'GET  /auth/sessions',
      'DELETE /auth/sessions/:sessionId',
      'DELETE /auth/sessions?all=1',
      'GET  /auth/blacklist   (admin)',
      'POST /auth/blacklist   (admin)'
    ]
  });
});

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/admin/login', AuthController.adminLogin);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/verify', AuthController.verify);

// sessions
router.get('/sessions', AuthController.listSessions);
router.delete('/sessions/:sessionId', AuthController.deleteSession);
router.delete('/sessions', AuthController.deleteOtherSessions);

// blacklist (gắn guard admin tại gateway hoặc thêm middleware role ở đây)
router.get('/blacklist', AuthController.adminListBlacklist);
router.post('/blacklist', AuthController.adminBlacklistToken);

export default router;
