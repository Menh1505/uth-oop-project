// Types and interfaces for the API Gateway
export interface ServiceConfig {
  name: string;
  instances: ServiceInstance[];
  healthPath: string;
  timeout: number;
  retryAttempts: number;
  circuitBreakerEnabled: boolean;
}

export interface ServiceInstance {
  host: string;
  port: number;
  weight: number;
  healthy: boolean;
  lastHealthCheck?: Date;
}

export interface RouteConfig {
  path: string;
  service: string;
  methods: string[];
  rateLimitConfig?: RateLimitConfig;
  authRequired?: boolean;
  stripPath?: boolean;
  preserveHost?: boolean;
  websocketEnabled?: boolean;
  cacheConfig?: CacheConfig;
}

export interface RateLimitConfig {
  max: number;
  timeWindow: string; // e.g., '1 minute', '1 hour'
  skipOnError?: boolean;
  keyGenerator?: string; // 'ip' | 'user' | 'custom'
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  varyByHeaders?: string[];
  excludeHeaders?: string[];
}

export interface GatewayConfig {
  server: {
    host: string;
    port: number;
    trustProxy: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string | undefined;
    db: number;
  };
  consul?: {
    host: string;
    port: number;
    datacenter: string;
  } | undefined;
  services: ServiceConfig[];
  routes: RouteConfig[];
  security: {
    cors: {
      enabled: boolean;
      origins: string[];
      credentials: boolean;
    };
    helmet: {
      enabled: boolean;
    };
  };
  monitoring: {
    prometheus: {
      enabled: boolean;
      path: string;
    };
    healthCheck: {
      enabled: boolean;
      path: string;
    };
  };
  logging: {
    level: string;
    format: 'json' | 'combined' | 'simple';
  };
}

export interface LoadBalancingStrategy {
  select(instances: ServiceInstance[]): ServiceInstance | null;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: Date;
  successCount: number;
}

export interface ProxyOptions {
  target: string;
  changeOrigin: boolean;
  timeout: number;
  retryDelay: number;
  maxRetries: number;
}

export interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
  clientIP: string;
  userAgent: string;
  route: RouteConfig;
  service: ServiceConfig;
  targetInstance: ServiceInstance;
}

export interface MetricsData {
  requestCount: number;
  responseTime: number;
  errorCount: number;
  activeConnections: number;
  serviceHealth: Record<string, boolean>;
}

export interface HealthCheckResult {
  service: string;
  instance: string;
  healthy: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
}