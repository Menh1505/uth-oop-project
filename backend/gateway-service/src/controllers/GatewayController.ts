import { Request, Response } from 'express';
import { GatewayService } from '../services/GatewayService';
import { MetricsService } from '../services/MetricsService';
import { GatewayRequest } from '../models/Gateway';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class GatewayController {
  static async routeRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Convert Express request to Gateway request
      const gatewayRequest: GatewayRequest = {
        method: req.method,
        path: req.path,
        headers: req.headers as Record<string, string>,
        body: req.body,
        query: req.query as Record<string, string>,
        params: req.params,
        user: req.user,
      };

      // Route the request
      const response = await GatewayService.routeRequest(gatewayRequest);

      // Set response headers
      if (response.headers) {
        Object.entries(response.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      // Send response
      res.status(response.status);
      if (response.data) {
        res.json(response.data);
      } else if (response.error) {
        res.json({ error: response.error });
      } else {
        res.end();
      }
    } catch (error) {
      console.error('Gateway controller error:', error);
      res.status(500).json({ 
        error: 'Internal gateway error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const healthChecks = await GatewayService.healthCheck();
      
      const overallHealth = healthChecks.every(check => check.status === 'healthy');
      
      // Update health metrics
      healthChecks.forEach(check => {
        MetricsService.setGauge('gateway_service_health', 
          check.status === 'healthy' ? 1 : 0,
          { service: check.service }
        );
      });

      res.status(overallHealth ? 200 : 503).json({
        status: overallHealth ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: healthChecks,
        gateway: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: '1.0.0',
        },
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'error',
        error: 'Failed to check service health',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await MetricsService.getMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error) {
      console.error('Metrics error:', error);
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  }

  static getInfo(req: Request, res: Response): void {
    res.json({
      service: 'gateway-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      features: [
        'Request Routing',
        'Authentication',
        'Rate Limiting',
        'Health Checks',
        'Metrics Collection',
        'Distributed Tracing',
      ],
      endpoints: {
        health: '/health',
        metrics: '/metrics',
        info: '/info',
        auth: '/api/auth/*',
        user: '/api/user/*', 
        admin: '/api/admin/*',
      },
    });
  }
}