import app from './app';

const PORT = process.env.PORT || 3004;

const server = app.listen(PORT, () => {
  console.log(`🏪 Partner Service is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🏬 Partner API: http://localhost:${PORT}/api`);
  console.log('=====================================');
  console.log('Available Endpoints:');
  console.log('- POST /api/partners - Create partner');
  console.log('- GET /api/partners - Get user partners');
  console.log('- GET /api/partners/:id - Get partner by ID');
  console.log('- PUT /api/partners/:id - Update partner');
  console.log('- POST /api/partners/:partnerId/restaurants - Create restaurant');
  console.log('- GET /api/restaurants/search - Search restaurants');
  console.log('- GET /api/restaurants/:id - Get restaurant');
  console.log('- POST /api/restaurants/:restaurantId/menu - Create menu item');
  console.log('- GET /api/restaurants/:restaurantId/menu - Get menu items');
  console.log('- POST /api/restaurants/:restaurantId/promotions - Create promotion');
  console.log('- POST /api/restaurants/:restaurantId/inventory - Create inventory');
  console.log('- GET /api/analytics/* - Analytics endpoints');
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