#!/usr/bin/env node

import 'dotenv/config';
import { APIGateway } from './gateway';
import { defaultConfig } from './config';

const gateway = new APIGateway(defaultConfig);

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  try {
    await gateway.shutdown();
    console.log('Gateway shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the gateway
async function start() {
  try {
    console.log('🚀 Starting UTH API Gateway...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Gateway Port: ${defaultConfig.server.port}`);
    console.log(`Redis Host: ${defaultConfig.redis.host}:${defaultConfig.redis.port}`);
    console.log(`Services: ${defaultConfig.services.length}`);
    console.log(`Routes: ${defaultConfig.routes.length}`);
    
    await gateway.start();
    
    console.log('✅ Gateway started successfully');
  } catch (error) {
    console.error('❌ Failed to start gateway:', error);
    process.exit(1);
  }
}

// Start the application
start();