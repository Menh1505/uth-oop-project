import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:uth@localhost:27017/fitfood_user_db?authSource=admin';
    
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ User Service: Connected to MongoDB');
  } catch (error) {
    console.error('❌ User Service MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('error', (error) => {
  console.error('❌ User Service MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ User Service MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ User Service MongoDB reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔒 User Service MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;
