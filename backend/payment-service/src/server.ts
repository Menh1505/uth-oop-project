import app from './app';

const PORT = process.env.PORT || 3003;

const server = app.listen(PORT, () => {
  console.log(`🚀 Payment Service is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Payment API: http://localhost:${PORT}/api`);
  console.log('=====================================');
  console.log('Available Endpoints:');
  console.log('- POST /api/payments - Create payment');
  console.log('- GET /api/payments - Get user payments');
  console.log('- GET /api/payments/:id - Get payment by ID');
  console.log('- PUT /api/payments/:id - Update payment');
  console.log('- DELETE /api/payments/:id - Cancel payment');
  console.log('- POST /api/refunds - Create refund');
  console.log('- POST /api/apple-pay - Apple Pay payment');
  console.log('- POST /api/payos - PayOS payment');
  console.log('- POST /api/mock - Mock payment (testing)');
  console.log('- POST /api/webhooks/* - Webhook handlers');
  console.log('- GET /api/stats - Payment statistics');
  console.log('=====================================');
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default server;