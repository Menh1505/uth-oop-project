import dotenv from 'dotenv';
import { App } from './app';

// Load environment variables
dotenv.config();

/**
 * Main server entry point
 * Initializes and starts the Delivery Service
 */
async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting Delivery Service...');
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗂️  Loading configuration...`);

    // Validate required environment variables
    const requiredEnvVars = [
      'DB_HOST',
      'DB_PORT', 
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      'JWT_SECRET'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingEnvVars);
      console.error('Please check your .env file or environment configuration');
      process.exit(1);
    }

    // Display configuration (without sensitive data)
    console.log('🔧 Configuration:');
    console.log(`   - Port: ${process.env.PORT || '3004'}`);
    console.log(`   - Host: ${process.env.HOST || '0.0.0.0'}`);
    console.log(`   - Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    console.log(`   - Node Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - JWT Secret: ${process.env.JWT_SECRET ? '***configured***' : '❌ missing'}`);
    
    if (process.env.ALLOWED_ORIGINS) {
      console.log(`   - CORS Origins: ${process.env.ALLOWED_ORIGINS}`);
    }

    // Initialize and start the application
    const app = new App();
    await app.start();

    console.log('✅ Delivery Service started successfully!');
    console.log('🔗 Service ready to handle requests');

  } catch (error) {
    console.error('❌ Failed to start Delivery Service:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }

    process.exit(1);
  }
}

// Handle startup errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception during startup:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection during startup:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default startServer;