// Use default JWT secret if not provided (not recommended for production)
const JWT_SECRET = process.env.JWT_SECRET || 'fitfood-nutrition-secret-key-default';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set, using default secret (not recommended for production)');
}

export const JWT_CONFIG = {
  secret: JWT_SECRET,
  expiresIn: '24h',
  algorithm: 'HS256' as const,
};

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}