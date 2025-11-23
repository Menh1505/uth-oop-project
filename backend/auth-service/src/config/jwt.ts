export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',        // access token TTL
  refreshExpiresInSec: parseInt(process.env.REFRESH_TTL_SEC || `${60*60*24*30}`, 10), // 30d
  issuer: process.env.JWT_ISSUER || 'auth-service',
  audience: process.env.JWT_AUD || 'gateway',
} as const;
