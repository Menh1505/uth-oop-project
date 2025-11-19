import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/status', UserController.status);

router.use(authenticate);
router.get('/me', UserController.getMe);
router.put('/me', UserController.updateMe);
router.post('/me/avatar', UserController.uploadAvatar);

router.get('/admin/users', UserController.listUsers);

export default router;
