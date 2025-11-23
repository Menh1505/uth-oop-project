export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'shared-secret',
  issuer: process.env.JWT_ISSUER || 'auth-service',
  audience: process.env.JWT_AUD || 'gateway',
} as const;
