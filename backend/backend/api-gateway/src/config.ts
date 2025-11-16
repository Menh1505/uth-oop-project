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
      name: 'admin-service',
      instances: [
        { host: 'admin-service', port: 3003, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'catalog-service',
      instances: [
        { host: 'catalog-service', port: 3003, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'workout-service',
      instances: [
        { host: 'workout-service', port: 3004, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'nutrition-service',
      instances: [
        { host: 'nutrition-service', port: 3003, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'order-service',
      instances: [
        { host: 'order-service', port: 3004, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'payment-service',
      instances: [
        { host: 'payment-service', port: 3003, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'partner-service',
      instances: [
        { host: 'partner-service', port: 3004, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'delivery-service',
      instances: [
        { host: 'delivery-service', port: 3004, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'notification-service',
      instances: [
        { host: 'notification-service', port: 3010, weight: 1, healthy: true }
      ],
      healthPath: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'recommendation-service',
      instances: [
        { host: 'recommendation-service', port: 3011, weight: 1, healthy: true }
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
    // Admin routes
    {
      path: '/api/admin',
      service: 'admin-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 30,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // Catalog routes with high throughput
    {
      path: '/api/catalog',
      service: 'catalog-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 100,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: false,
      stripPath: true,
      cacheConfig: {
        enabled: true,
        ttl: 300, // 5 minutes cache for catalog data
        varyByHeaders: ['Accept-Language'],
      },
    },
    // Workout routes
    {
      path: '/api/workouts',
      service: 'workout-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 50,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // Nutrition routes
    {
      path: '/api/nutrition',
      service: 'nutrition-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 50,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // Recommendation routes
    {
      path: '/api/recommendations',
      service: 'recommendation-service',
      methods: ['GET', 'POST'],
      rateLimitConfig: {
        max: 30,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: false, // Keep the /api prefix for this service
    },
    // Order routes with high throughput
    {
      path: '/api/orders',
      service: 'order-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 100,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // Payment routes
    {
      path: '/api/payments',
      service: 'payment-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 50,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // Partner routes
    {
      path: '/api/partners',
      service: 'partner-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 30,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
    },
    // Delivery routes with high throughput and WebSocket support
    {
      path: '/api/deliveries',
      service: 'delivery-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 100,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: true,
      websocketEnabled: true,
    },
    // WebSocket route for delivery tracking
    {
      path: '/ws/delivery',
      service: 'delivery-service',
      methods: ['GET'],
      authRequired: true,
      stripPath: false,
      websocketEnabled: true,
    },
    // Notification routes
    {
      path: '/api/notifications',
      service: 'notification-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimitConfig: {
        max: 50,
        timeWindow: '1 minute',
        keyGenerator: 'ip'
      },
      authRequired: true,
      stripPath: false, // Keep the /api prefix for this service
    },
    // WebSocket route for notifications
    {
      path: '/ws/notifications',
      service: 'notification-service',
      methods: ['GET'],
      authRequired: true,
      stripPath: false,
      websocketEnabled: true,
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