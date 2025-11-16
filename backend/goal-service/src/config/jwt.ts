export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  issuer: process.env.JWT_ISSUER || 'goal-service',
  audience: process.env.JWT_AUD || 'gateway',
} as const;