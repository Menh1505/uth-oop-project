import express from 'express';
import NotificationService from '../services/NotificationService';

export const router = express.Router();

// Create notification (and optionally send immediately)
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const n = await NotificationService.create(payload);
    if (payload.sendImmediately) {
      await NotificationService.send(n.id);
    }
    res.status(201).json({ success: true, data: n });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List notifications
router.get('/', async (req, res) => {
  const list = await NotificationService.list();
  res.json({ success: true, data: list });
});

// Get single
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const n = await NotificationService.get(id);
  if (!n) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: n });
});

// Update (partial)
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const patched = await NotificationService.update(id, req.body);
  if (!patched) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: patched });
});

// Delete
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const ok = await NotificationService.remove(id);
  res.json({ success: ok });
});

// Send / retry
router.post('/:id/send', async (req, res) => {
  try {
    const n = await NotificationService.send(req.params.id);
    res.json({ success: true, data: n });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
