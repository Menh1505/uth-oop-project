import { GatewayConfig } from './types';

// Environment variable helper function
const env = (key: string, defaultValue?: string): string => {
  return process.env[key] ?? defaultValue ?? '';
};

const envInt = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

export const defaultConfig: GatewayConfig = {
  server: {
    host: '0.0.0.0',
    port: envInt('GATEWAY_PORT', 8080),
    trustProxy: true,
  },
  redis: {
    host: env('REDIS_HOST', 'redis'),
    port: envInt('REDIS_PORT', 6379),
    password: env('REDIS_PASSWORD') || undefined,
    db: envInt('REDIS_DB', 0),
  },
  consul: env('CONSUL_ENABLED') === 'true' ? {
    host: env('CONSUL_HOST', 'consul'),
    port: envInt('CONSUL_PORT', 8500),
    datacenter: env('CONSUL_DATACENTER', 'dc1'),
  } : undefined,
  services: [
    {
      name: 'auth-service',
      instances: [
        { host: 'auth-service', port: 3001, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'user-service',
      instances: [
        { host: 'user-service', port: 3002, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'meal-service',
      instances: [
        { host: 'meal-service', port: 3004, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'exercise-service',
      instances: [
        { host: 'exercise-service', port: 3005, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'goal-service',
      instances: [
        { host: 'goal-service', port: 3006, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'recommendation-service',
      instances: [
        { host: 'recommendation-service', port: 3007, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 45000, // Higher timeout for AI recommendations
      retryAttempts: 2,
      circuitBreakerEnabled: true,
    },
    {
      name: 'payment-service',
      instances: [
        { host: 'payment-service', port: 3008, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
  ],
  routes: [
    // Authentication routes with stricter rate limiting
    {
      path: '/api/auth',
      service: 'auth-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 5,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: false,
      stripPath: true,
    },
    // User management routes
    {
      path: '/api/users',
      service: 'user-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 50,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // Meal management routes
    {
      path: '/api/meals',
      service: 'meal-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 50,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // Food management routes
    {
      path: '/api/foods',
      service: 'meal-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 100,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
      cacheConfig: {
        enabled: true,
        ttl: 300, // 5 minutes cache for food data
        varyByHeaders: ['Accept-Language'],
      },
    },
    // Nutrition analysis routes
    {
      path: '/api/nutrition',
      service: 'meal-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 50,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // Exercise management routes
    {
      path: '/api/exercises',
      service: 'exercise-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 50,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // Goal management routes
    {
      path: '/api/goals',
      service: 'goal-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 50,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // AI Recommendation routes
    {
      path: '/api/recommendations',
      service: 'recommendation-service',
      methods: ['GET', 'POST'],
      rateLimitConfig: {
        max: 10, // More restrictive due to AI API costs
        timeWindow: '5 minutes',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // Payment and subscription routes
    {
      path: '/api/payments',
      service: 'payment-service',
      methods: ['GET', 'POST', 'DELETE'],
      rateLimitConfig: {
        max: 20,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: false, // Public routes like /plans don't need auth
      stripPath: true,
    },
  ],
  security: {
    cors: {
      enabled: true,
      origins: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    },
    helmet: {
      enabled: true,
    },
  },
  monitoring: {
    prometheus: {
      enabled: true,
      path: '/metrics',
    },
    healthCheck: {
      enabled: true,
      path: '/health',
    },
  },
  logging: {
    level: env('LOG_LEVEL', 'info'),
    format: 'json',
  },
};