import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RouteConfig, ServiceConfig, GatewayConfig, RequestContext } from './types';
import { defaultConfig } from './config';
import { LoadBalancer } from './core/load-balancer';
import { CircuitBreakerManager } from './core/circuit-breaker';
import { HealthChecker } from './core/health-checker';
import { v4 as uuidv4 } from 'uuid';

export class APIGateway {
  private app: FastifyInstance;
  private config: GatewayConfig;
  private loadBalancer: LoadBalancer;
  private circuitBreakers: CircuitBreakerManager;
  private healthChecker: HealthChecker;
  private isShuttingDown: boolean = false;

  constructor(config: Partial<GatewayConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.app = fastify({
      logger: {
        level: this.config.logging.level,
      },
      trustProxy: this.config.server.trustProxy,
      requestIdHeader: 'x-request-id',
    });

    this.loadBalancer = new LoadBalancer('round-robin');
    this.circuitBreakers = new CircuitBreakerManager();
    this.healthChecker = new HealthChecker();

    this.setupMiddleware();
    this.setupRoutes();
  }

  private async setupMiddleware(): Promise<void> {
    // Request context middleware
    this.app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
      if (this.isShuttingDown) {
        reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Gateway is shutting down',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Generate request ID if not provided
      if (!request.headers['x-request-id']) {
        request.headers['x-request-id'] = uuidv4();
      }

      // Add timing information
      (request as any).startTime = Date.now();
    });

    // CORS handling
    this.app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
      const origin = request.headers.origin;
      const allowedOrigins = ['http://localhost:3000','http://localhost:5173', 'http://localhost:3001'];
      
      if (origin && allowedOrigins.includes(origin)) {
        reply.header('Access-Control-Allow-Origin', origin);
        reply.header('Access-Control-Allow-Credentials', 'true');
      }

      if (request.method === 'OPTIONS') {
        reply
          .header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
          .header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,X-Request-ID')
          .code(200)
          .send();
        return;
      }
    });

    // Response logging
    this.app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
      const responseTime = Date.now() - ((request as any).startTime || Date.now());
      
      this.app.log.info({
        request_id: request.headers['x-request-id'],
        method: request.method,
        url: request.url,
        status_code: reply.statusCode,
        response_time: responseTime,
        ip: request.ip,
      }, 'Request completed');
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
      const healthStatus = this.healthChecker.getHealthStatus(this.config.services);
      const allServicesHealthy = Object.values(healthStatus).every((service: any) => service.healthy);
      
      reply.code(allServicesHealthy ? 200 : 503).send({
        status: allServicesHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: healthStatus,
        uptime: process.uptime(),
        version: '1.0.0',
      });
    });

    // Metrics endpoint
    this.app.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
      reply.send('# Simple metrics endpoint\n# gateway_requests_total 0\n');
    });

    // Circuit breaker status endpoint
    this.app.get('/admin/circuit-breakers', async (request: FastifyRequest, reply: FastifyReply) => {
      const states = this.circuitBreakers.getAllStates();
      reply.send({
        circuit_breakers: states,
        timestamp: new Date().toISOString(),
      });
    });

    // Setup proxy routes
    this.setupProxyRoutes();
    
    // Default 404 handler
    this.app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
      reply.code(404).send({
        error: 'API endpoint not found',
        available_endpoints: this.config.routes.map(route => route.path),
        timestamp: new Date().toISOString(),
        request_id: request.headers['x-request-id'],
      });
    });

    // Global error handler
    this.app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
      this.app.log.error({
        error: error.message,
        stack: error.stack,
        request_id: request.headers['x-request-id'],
        method: request.method,
        url: request.url,
      }, 'Request error');

      reply.code(500).send({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        request_id: request.headers['x-request-id'],
      });
    });
  }

  private setupProxyRoutes(): void {
    this.config.routes.forEach(route => {
      const service = this.config.services.find(s => s.name === route.service);
      if (!service) {
        this.app.log.error(`Service ${route.service} not found for route ${route.path}`);
        return;
      }

      // Create route handler
      this.app.route({
        method: route.methods as any,
        url: `${route.path}*`,
        handler: this.createProxyHandler(route, service),
      });

      // Handle redirect for URLs without trailing slash
      if (!route.path.endsWith('/')) {
        this.app.get(route.path, async (request: FastifyRequest, reply: FastifyReply) => {
          reply.redirect(301, `${route.path}/`);
        });
      }
    });
  }

  private createProxyHandler(route: RouteConfig, service: ServiceConfig) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = request.headers['x-request-id'] as string;
      
      try {
        // Check circuit breaker
        if (!this.circuitBreakers.canExecute(service.name)) {
          reply.code(503).send({
            error: 'Service Unavailable',
            message: `Service ${service.name} is currently unavailable`,
            timestamp: new Date().toISOString(),
            request_id: requestId,
          });
          return;
        }

        // Select healthy instance
        const instance = this.loadBalancer.selectInstance(service.instances);
        if (!instance) {
          reply.code(503).send({
            error: 'Service Unavailable',
            message: 'No healthy instances available',
            timestamp: new Date().toISOString(),
            request_id: requestId,
          });
          return;
        }

        // Create request context
        const context: RequestContext = {
          requestId,
          startTime: (request as any).startTime || Date.now(),
          clientIP: request.ip,
          userAgent: request.headers['user-agent'] || '',
          route,
          service,
          targetInstance: instance,
        };

        // Proxy the request (placeholder implementation)
        const targetUrl = `http://${context.targetInstance.host}:${context.targetInstance.port}`;
        const path = context.route.stripPath ? 
          request.url.replace(new RegExp(`^${context.route.path}`), '') : 
          request.url;

        reply.code(200).send({
          message: `Proxy to ${targetUrl}${path}`,
          service: context.service.name,
          instance: `${context.targetInstance.host}:${context.targetInstance.port}`,
          request_id: context.requestId,
          timestamp: new Date().toISOString(),
        });

        this.circuitBreakers.onSuccess(context.service.name);

      } catch (error) {
        this.circuitBreakers.onFailure(service.name, error instanceof Error ? error : new Error('Unknown error'));
        
        this.app.log.error({
          error: error instanceof Error ? error.message : 'Unknown error',
          service: service.name,
          request_id: requestId,
        }, 'Proxy error');

        reply.code(502).send({
          error: 'Bad Gateway',
          message: 'Unable to connect to backend service',
          timestamp: new Date().toISOString(),
          request_id: requestId,
        });
      }
    };
  }

  async start(): Promise<void> {
    try {
      // Start health checking
      this.healthChecker.start(this.config.services);

      // Start the HTTP server using the new API
      const address = await this.app.listen({
        port: this.config.server.port,
        host: this.config.server.host
      });

      // this.app.log.info(`API Gateway started on ${address}`);
      // this.app.log.info(`Health check endpoint: /health`);
      // this.app.log.info(`Configured routes: ${this.config.routes.length}`);
      // this.app.log.info(`Configured services: ${this.config.services.length}`);

    } catch (error) {
      this.app.log.error(error, 'Failed to start gateway');
      process.exit(1);
    }
  }

  async shutdown(): Promise<void> {
    this.app.log.info('Starting graceful shutdown...');
    this.isShuttingDown = true;

    try {
      this.healthChecker.stop();
      await this.app.close();
      this.app.log.info('Gateway shutdown completed');
    } catch (error) {
      this.app.log.error(error, 'Error during shutdown');
      process.exit(1);
    }
  }

  getApp(): FastifyInstance {
    return this.app;
  }
}