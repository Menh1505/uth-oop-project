export const aiConfig = {
  port: process.env.PORT || 3004,
  jwtSecret: process.env.JWT_SECRET || 'shared-secret',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://user-service:3002',
  maxTokens: parseInt(process.env.MAX_TOKENS || '500'),
  temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  nodeEnv: process.env.NODE_ENV || 'development'
} as const;

export default aiConfig;