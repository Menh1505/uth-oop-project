export interface GatewayRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface GatewayResponse {
  status: number;
  headers?: Record<string, string>;
  data?: any;
  error?: string;
}

export interface ServiceRoute {
  pattern: string;
  service: string;
  method?: string[];
  requireAuth?: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}