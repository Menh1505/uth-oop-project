export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'fitfood-workout-secret-key',
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