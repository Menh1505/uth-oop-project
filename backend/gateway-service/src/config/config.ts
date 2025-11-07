export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  },

  // Service URLs
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      timeout: 5000,
    },
    user: {
      url: process.env.USER_SERVICE_URL || 'http://user-service:3002',
      timeout: 5000,
    },
    admin: {
      url: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3003',
      timeout: 5000,
    },
    catalog: {
      url: process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3003',
      timeout: 5000,
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
  },

  // Observability
  observability: {
    jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
    prometheusPort: process.env.PROMETHEUS_PORT || 9090,
    serviceName: 'gateway-service',
    serviceVersion: '1.0.0',
  },
};