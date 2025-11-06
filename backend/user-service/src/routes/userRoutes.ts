import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Simple status endpoint for testing (public)
router.get('/status', (req, res) => {
  res.json({
    service: 'user-service',
    status: 'healthy',
    version: '1.0.0',
    database: 'user_db',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /profile',
      'PUT /profile',
      'GET /users',
      'GET /status'
    ]
  });
});

// All routes require authentication
router.use(authenticate);

// Current user profile endpoints
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

// Admin endpoints for managing all users
router.get('/users', UserController.getAllUsers);
router.get('/users/:id', UserController.getUserById);
router.post('/users', UserController.createUser);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

export default router;
