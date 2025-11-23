import express from 'express';
import bodyParser from 'body-parser';
import registerRoutes from './routes';
import errorHandler from './middleware/errorHandler';

export function createApp() {
  const app = express();
  app.use(bodyParser.json());
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  registerRoutes(app);
  app.use(errorHandler as any);
  return app;
}

export default createApp;
