import express from 'express';
import notificationRoutes from '../controllers/NotificationController';
import eventRoutes from '../controllers/EventController';

export default function registerRoutes(app: express.Express) {
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/events', eventRoutes);
}
