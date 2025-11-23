export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
};

export const serviceConfig = {
  port: process.env.PORT || 3003,
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
};
