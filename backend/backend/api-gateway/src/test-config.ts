import { GatewayConfig } from './types';

// Environment variable helper function
const env = (key: string, defaultValue?: string): string => {
  return process.env[key] ?? defaultValue ?? '';
};

const envInt = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

export const testConfig: GatewayConfig = {
  server: {
    host: '0.0.0.0',
    port: envInt('GATEWAY_PORT', 8080),
    trustProxy: true,
  },
  redis: {
    host: env('REDIS_HOST', 'redis'),
    port: envInt('REDIS_PORT', 6379),
    db: envInt('REDIS_DB', 0),
  },
  // Chỉ bao gồm 2 services: auth và user
  services: [
    {
      name: 'auth-service',
      instances: [
        { 
          host: 'auth-service', 
          port: 3001, 
          weight: 1,
          healthy: false
        }
      ],
      healthPath: '/health',
      timeout: 10000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
    {
      name: 'user-service',
      instances: [
        { 
          host: 'user-service', 
          port: 3002, 
          weight: 1,
          healthy: false
        }
      ],
      healthPath: '/health',
      timeout: 10000,
      retryAttempts: 3,
      circuitBreakerEnabled: true,
    },
  ],
  routes: [
    // Auth Service Routes
    {
      path: '/api/auth',
      service: 'auth-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      stripPath: false,
      preserveHost: true,
    },
    {
      path: '/auth',
      service: 'auth-service', 
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      stripPath: false,
      preserveHost: true,
    },
    
    // User Service Routes  
    {
      path: '/api/users',
      service: 'user-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      stripPath: false,
      preserveHost: true,
    },
    {
      path: '/users',
      service: 'user-service',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      stripPath: false,
      preserveHost: true,
    },
  ],
  security: {
    cors: {
      enabled: true,
      origins: env('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://localhost:8080').split(','),
      credentials: env('CORS_CREDENTIALS', 'true') === 'true',
    },
    helmet: {
      enabled: true,
    },
  },
  monitoring: {
    prometheus: {
      enabled: env('PROMETHEUS_ENABLED', 'true') === 'true',
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