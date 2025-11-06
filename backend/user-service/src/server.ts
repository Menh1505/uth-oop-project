import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';
import { MessageConsumer } from './services/messageConsumer';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
  MessageConsumer.start().catch(console.error);
});
