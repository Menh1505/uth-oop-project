import { Router } from 'express';
import multer from 'multer';
import { UserController } from '../controllers/UserController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB avatar limit
});

router.get('/status', UserController.status);

router.use(authenticate);
router.get('/me', UserController.getMe);
router.put('/me', UserController.updateMe);
router.post('/me/avatar', upload.single('avatar'), UserController.uploadAvatar);

router.get('/admin/users', UserController.listUsers);

export default router;
