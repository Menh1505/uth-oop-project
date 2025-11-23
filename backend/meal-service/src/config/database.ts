import mongoose from 'mongoose';
import logger from './logger';

const DEFAULT_URI = 'mongodb://admin:admin@localhost:27017/fitfood_meal_db?authSource=admin';

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(uri);
    logger.info('[meal-service] Connected to MongoDB');
  } catch (error) {
    logger.error({ error }, '[meal-service] Failed to connect MongoDB');
    throw error;
  }
}

mongoose.connection.on('connected', () => {
  logger.info('[meal-service] MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('[meal-service] MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  logger.error({ error }, '[meal-service] MongoDB connection error');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('[meal-service] MongoDB connection closed');
  process.exit(0);
});
