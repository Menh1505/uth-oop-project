import axios, { AxiosResponse } from 'axios';
import { trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { GatewayRequest, GatewayResponse, ServiceRoute, HealthCheck } from '../models/Gateway';
import { config } from '../config/config';
import { MetricsService } from './MetricsService';

const tracer = trace.getTracer('gateway-service');

export class GatewayService {
  private static routes: ServiceRoute[] = [
    // Auth service routes
    { pattern: '/api/auth/**', service: 'auth', requireAuth: false },
    { pattern: '/api/auth/logout', service: 'auth', requireAuth: true },
    { pattern: '/api/auth/verify', service: 'auth', requireAuth: false },

    // User service routes
    { pattern: '/api/user/**', service: 'user', requireAuth: true },
    { pattern: '/api/user/status', service: 'user', requireAuth: false },

    // Admin service routes
    { pattern: '/api/admin/**', service: 'admin', requireAuth: true },
    { pattern: '/api/admin/status', service: 'admin', requireAuth: false },
  ];

  static async routeRequest(req: GatewayRequest): Promise<GatewayResponse> {
    const span = tracer.startSpan('gateway-route-request', {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': req.method,
        'http.url': req.path,
        'user.id': req.user?.id || 'anonymous',
      },
    });

    const startTime = Date.now();

    try {
      // Find matching route
      const route = this.findRoute(req.path);
      if (!route) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Route not found' });
        MetricsService.incrementCounter('gateway_requests_total', {
          method: req.method,
          status: '404',
          service: 'unknown',
        });
        return {
          status: 404,
          error: 'Route not found',
        };
      }

      span.setAttributes({
        'service.name': route.service,
        'route.pattern': route.pattern,
      });

      // Get service URL
      const serviceUrl = this.getServiceUrl(route.service);
      if (!serviceUrl) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Service not configured' });
        return {
          status: 500,
          error: 'Service not configured',
        };
      }

      // Forward request
      const response = await this.forwardRequest(req, serviceUrl, route);
      
      const duration = Date.now() - startTime;
      MetricsService.recordHistogram('gateway_request_duration_ms', duration, {
        method: req.method,
        service: route.service,
        status: response.status.toString(),
      });

      MetricsService.incrementCounter('gateway_requests_total', {
        method: req.method,
        status: response.status.toString(),
        service: route.service,
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });

      MetricsService.recordHistogram('gateway_request_duration_ms', duration, {
        method: req.method,
        service: 'unknown',
        status: '500',
      });

      MetricsService.incrementCounter('gateway_requests_total', {
        method: req.method,
        status: '500',
        service: 'unknown',
      });

      console.error('Gateway routing error:', error);
      return {
        status: 500,
        error: 'Internal gateway error',
      };
    } finally {
      span.end();
    }
  }

  private static findRoute(path: string): ServiceRoute | null {
    return this.routes.find(route => {
      const pattern = route.pattern.replace('**', '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    }) || null;
  }

  private static getServiceUrl(service: string): string | null {
    switch (service) {
      case 'auth':
        return config.services.auth.url;
      case 'user':
        return config.services.user.url;
      case 'admin':
        return config.services.admin.url;
      default:
        return null;
    }
  }

  private static async forwardRequest(
    req: GatewayRequest,
    serviceUrl: string,
    route: ServiceRoute
  ): Promise<GatewayResponse> {
    const span = tracer.startSpan('gateway-forward-request', {
      kind: SpanKind.CLIENT,
      attributes: {
        'service.url': serviceUrl,
        'http.method': req.method,
      },
    });

    try {
      // Remove gateway prefix from path
      const servicePath = req.path.replace('/api/' + route.service.split('-')[0], '');
      const url = `${serviceUrl}${servicePath}`;

      const response: AxiosResponse = await axios({
        method: req.method as any,
        url,
        headers: req.headers,
        data: req.body,
        params: req.query,
        timeout: config.services.auth.timeout,
      });

      span.setStatus({ code: SpanStatusCode.OK });

      return {
        status: response.status,
        headers: response.headers as Record<string, string>,
        data: response.data,
      };
    } catch (error: any) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });

      if (error.response) {
        return {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data,
        };
      }

      throw error;
    } finally {
      span.end();
    }
  }

  static async healthCheck(): Promise<HealthCheck[]> {
    const services = ['auth', 'user', 'admin'];
    const healthChecks = await Promise.all(
      services.map(service => this.checkServiceHealth(service))
    );
    return healthChecks;
  }

  private static async checkServiceHealth(service: string): Promise<HealthCheck> {
    const serviceUrl = this.getServiceUrl(service);
    const startTime = Date.now();

    try {
      const response = await axios.get(`${serviceUrl}/health`, {
        timeout: 5000,
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        service,
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        responseTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        service,
        status: 'unhealthy',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}