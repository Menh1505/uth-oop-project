import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { CreateOrderSchema, UpdateStatusSchema } from '../models/order.js';
import * as OrderService from '../services/order.service.js';

const r = Router();
r.use(requireUser);

r.post('/', async (req, res, next) => {
  try {
    const body = CreateOrderSchema.parse(req.body);
    const userId = (req as any).userId as number;
    const order = await OrderService.createOrder(userId, body);
    res.status(201).json(order);
  } catch (e) { next(e); }
});

r.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    const status = req.query.status as any;
    const orders = await OrderService.listOrders(userId, limit, cursor, status);
    res.json(orders);
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const order = await OrderService.getOrder(userId, Number(req.params.id));
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(order);
  } catch (e) { next(e); }
});

r.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = UpdateStatusSchema.parse(req.body);
    const userId = (req as any).userId as number;
    const updated = await OrderService.updateStatus(userId, Number(req.params.id), status);
    res.json(updated);
  } catch (e) { next(e); }
});

export default r;
