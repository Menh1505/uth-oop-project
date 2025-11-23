import express from 'express';
import NotificationService from '../services/NotificationService';

export const router = express.Router();

// Accept generic system events and trigger notifications
router.post('/', async (req, res) => {
  try {
    const event = req.body; // { eventType, payload }
    const result = await NotificationService.handleEvent(event);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
