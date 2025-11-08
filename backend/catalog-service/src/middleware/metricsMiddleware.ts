import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create metrics
const httpRequestDuration = new client.Histogram({
  name: 'catalog_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'catalog_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const catalogOperations = new client.Counter({
  name: 'catalog_operations_total',
  help: 'Total number of catalog operations',
  labelNames: ['operation', 'status']
});

const inventoryLevels = new client.Gauge({
  name: 'catalog_inventory_levels',
  help: 'Current inventory levels',
  labelNames: ['product_id', 'product_name']
});

const lowStockAlerts = new client.Counter({
  name: 'catalog_low_stock_alerts_total',
  help: 'Total number of low stock alerts',
  labelNames: ['product_id']
});

// Register metrics
client.register.registerMetric(httpRequestDuration);
client.register.registerMetric(httpRequestTotal);
client.register.registerMetric(catalogOperations);
client.register.registerMetric(inventoryLevels);
client.register.registerMetric(lowStockAlerts);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });
  
  next();
};

export const metrics = {
  httpRequestDuration,
  httpRequestTotal,
  catalogOperations,
  inventoryLevels,
  lowStockAlerts
};

export { client };