import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCompress from 'fastify-compress';
import fastifyHelmet from 'fastify-helmet';
import fastifyRateLimit from 'fastify-rate-limit';
import fastifyRedis from 'fastify-redis';
import { createProxyMiddleware } from 'http-proxy-middleware';
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
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
            headers: req.headers,
            hostname: req.hostname,
            remoteAddress: req.ip,
            remotePort: req.socket?.remotePort,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
            headers: res.getHeaders(),
          }),
        },
      },
      trustProxy: this.config.server.trustProxy,
      disableRequestLogging: false,
      requestIdHeader: 'x-request-id',
      requestIdLogLabel: 'request_id',
    });

    this.loadBalancer = new LoadBalancer('weighted');
    this.circuitBreakers = new CircuitBreakerManager();
    this.healthChecker = new HealthChecker();

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware stack
   */
  private async setupMiddleware(): Promise<void> {
    // Security middleware
    if (this.config.security.helmet.enabled) {
      await this.app.register(fastifyHelmet, {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      });
    }

    // Compression middleware
    await this.app.register(fastifyCompress, {
      encodings: ['gzip', 'deflate'],
      threshold: 1024,
    });

    // Redis connection for rate limiting and caching
    await this.app.register(fastifyRedis, {
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
      family: 4,
      lazyConnect: true,
    });

    // Rate limiting
    await this.app.register(fastifyRateLimit, {
      global: true,
      max: 1000, // Default global limit
      timeWindow: '1 minute',
      redis: this.app.redis,
      allowList: ['127.0.0.1', '::1'],
      keyGenerator: (request) => request.ip,
      errorResponseBuilder: () => ({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
        statusCode: 429,
        timestamp: new Date().toISOString(),
      }),
    });

    // Request context middleware
    this.app.addHook('onRequest', async (request, reply) => {
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
    if (this.config.security.cors.enabled) {
      this.app.addHook('onRequest', async (request, reply) => {
        const origin = request.headers.origin;
        const allowedOrigins = this.config.security.cors.origins;
        
        if (origin && allowedOrigins.includes(origin)) {
          reply.header('Access-Control-Allow-Origin', origin);
          reply.header('Access-Control-Allow-Credentials', this.config.security.cors.credentials);
        }

        if (request.method === 'OPTIONS') {
          reply
            .header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
            .header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,X-Request-ID')
            .header('Access-Control-Max-Age', '86400')
            .code(200)
            .send();
          return;
        }
      });
    }

    // Response logging
    this.app.addHook('onResponse', async (request, reply) => {
      const responseTime = Date.now() - ((request as any).startTime || Date.now());
      
      this.app.log.info({
        request_id: request.headers['x-request-id'],
        method: request.method,
        url: request.url,
        status_code: reply.statusCode,
        response_time: responseTime,
        user_agent: request.headers['user-agent'],
        ip: request.ip,
      }, 'Request completed');
    });
  }

  /**
   * Setup routes and proxy handlers
   */
  private setupRoutes(): void {
    // Health check endpoint
    if (this.config.monitoring.healthCheck.enabled) {
      this.app.get(this.config.monitoring.healthCheck.path, async (request, reply) => {
        const healthStatus = this.healthChecker.getHealthStatus(this.config.services);
        const allServicesHealthy = Object.values(healthStatus).every((service: any) => service.healthy);
        
        reply.code(allServicesHealthy ? 200 : 503).send({
          status: allServicesHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          services: healthStatus,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: require('../package.json').version,
        });
      });
    }

    // Metrics endpoint (Prometheus format)
    if (this.config.monitoring.prometheus.enabled) {
      this.app.get(this.config.monitoring.prometheus.path, async (request, reply) => {
        // TODO: Implement Prometheus metrics
        reply.send('# Metrics endpoint - TODO: implement Prometheus metrics\n');
      });
    }

    // Circuit breaker status endpoint
    this.app.get('/admin/circuit-breakers', async (request, reply) => {
      const states = this.circuitBreakers.getAllStates();
      reply.send({
        circuit_breakers: states,
        timestamp: new Date().toISOString(),
      });
    });

    // Setup proxy routes
    this.setupProxyRoutes();
    
    // Default 404 handler
    this.app.setNotFoundHandler((request, reply) => {
      reply.code(404).send({
        error: 'API endpoint not found',
        available_endpoints: this.config.routes.map(route => route.path),
        timestamp: new Date().toISOString(),
        request_id: request.headers['x-request-id'],
      });
    });

    // Global error handler
    this.app.setErrorHandler((error, request, reply) => {
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

  /**
   * Setup proxy routes for each configured route
   */
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
        preHandler: route.rateLimitConfig ? 
          this.createRateLimitHandler(route.rateLimitConfig) : 
          undefined,
        handler: this.createProxyHandler(route, service),
      });

      // Handle redirect for URLs without trailing slash
      if (!route.path.endsWith('/')) {
        this.app.get(route.path, async (request, reply) => {
          reply.redirect(301, `${route.path}/`);
        });
      }
    });
  }

  /**
   * Create rate limit handler for a route
   */
  private createRateLimitHandler(rateLimitConfig: any) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Custom rate limiting logic would go here
      // For now, we'll rely on the global rate limiter
      return;
    };
  }

  /**
   * Create proxy handler for a route
   */
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

        // Proxy the request
        await this.proxyRequest(request, reply, context);

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

  /**
   * Proxy request to backend service
   */
  private async proxyRequest(request: FastifyRequest, reply: FastifyReply, context: RequestContext): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetUrl = `http://${context.targetInstance.host}:${context.targetInstance.port}`;
      const path = context.route.stripPath ? 
        request.url.replace(new RegExp(`^${context.route.path}`), '') : 
        request.url;

      // TODO: Implement actual proxy logic using http-proxy or similar
      // This is a placeholder implementation
      reply.code(200).send({
        message: `Proxy to ${targetUrl}${path}`,
        service: context.service.name,
        instance: `${context.targetInstance.host}:${context.targetInstance.port}`,
        request_id: context.requestId,
        timestamp: new Date().toISOString(),
      });

      this.circuitBreakers.onSuccess(context.service.name);
      resolve();
    });
  }

  /**
   * Start the gateway server
   */
  async start(): Promise<void> {
    try {
      // Start health checking
      this.healthChecker.start(this.config.services);

      // Start the HTTP server
      const address = await this.app.listen(
        this.config.server.port,
        this.config.server.host
      );

      this.app.log.info(`API Gateway started on ${address}`);
      this.app.log.info(`Health check endpoint: ${this.config.monitoring.healthCheck.path}`);
      this.app.log.info(`Configured routes: ${this.config.routes.length}`);
      this.app.log.info(`Configured services: ${this.config.services.length}`);

    } catch (error) {
      this.app.log.error(error, 'Failed to start gateway');
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.app.log.info('Starting graceful shutdown...');
    this.isShuttingDown = true;

    try {
      // Stop health checking
      this.healthChecker.stop();

      // Close server
      await this.app.close();
      
      this.app.log.info('Gateway shutdown completed');
    } catch (error) {
      this.app.log.error(error, 'Error during shutdown');
      process.exit(1);
    }
  }

  /**
   * Get gateway instance for testing
   */
  getApp(): FastifyInstance {
    return this.app;
  }
}