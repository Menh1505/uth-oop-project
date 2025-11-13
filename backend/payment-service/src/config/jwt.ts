export const JWT_SECRET = process.env.JWT_SECRET || 'payment-service-secret-key-12345';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const jwtConfig = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN,
  algorithm: 'HS256' as const
};