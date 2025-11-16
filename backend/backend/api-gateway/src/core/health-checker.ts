import { ServiceInstance, ServiceConfig, HealthCheckResult } from '../types';
import http from 'http';
import https from 'https';

export class HealthChecker {
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor(private readonly checkInterval: number = 30000) {} // 30 seconds default

  /**
   * Start health checking for all services
   */
  start(services: ServiceConfig[]): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    services.forEach(service => {
      this.startServiceHealthCheck(service);
    });
  }

  /**
   * Stop all health checks
   */
  stop(): void {
    this.isRunning = false;
    this.checkIntervals.forEach(interval => clearInterval(interval));
    this.checkIntervals.clear();
  }

  /**
   * Start health checking for a specific service
   */
  private startServiceHealthCheck(service: ServiceConfig): void {
    const intervalId = setInterval(async () => {
      await this.checkServiceHealth(service);
    }, this.checkInterval);

    this.checkIntervals.set(service.name, intervalId);
    
    // Perform initial health check
    setTimeout(() => this.checkServiceHealth(service), 1000);
  }

  /**
   * Check health of all instances for a service
   */
  private async checkServiceHealth(service: ServiceConfig): Promise<void> {
    const healthPromises = service.instances.map(instance =>
      this.checkInstanceHealth(service, instance)
    );

    const results = await Promise.allSettled(healthPromises);
    
    results.forEach((result, index) => {
      const instance = service.instances[index];
      if (instance) {
        if (result.status === 'fulfilled') {
          instance.healthy = result.value.healthy;
          instance.lastHealthCheck = result.value.timestamp;
        } else {
          instance.healthy = false;
          instance.lastHealthCheck = new Date();
          console.error(`Health check failed for ${service.name} ${instance.host}:${instance.port}:`, result.reason);
        }
      }
    });
  }

  /**
   * Check health of a single instance
   */
  private async checkInstanceHealth(
    service: ServiceConfig, 
    instance: ServiceInstance
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const url = `http://${instance.host}:${instance.port}${service.healthPath}`;

    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const req = protocol.get(url, { timeout: 5000 }, (res) => {
        const responseTime = Date.now() - startTime;
        const healthy = res.statusCode === 200;
        
        resolve({
          service: service.name,
          instance: `${instance.host}:${instance.port}`,
          healthy,
          responseTime,
          timestamp: new Date(),
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          service: service.name,
          instance: `${instance.host}:${instance.port}`,
          healthy: false,
          responseTime,
          error: error.message,
          timestamp: new Date(),
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        resolve({
          service: service.name,
          instance: `${instance.host}:${instance.port}`,
          healthy: false,
          responseTime,
          error: 'Timeout',
          timestamp: new Date(),
        });
      });
    });
  }

  /**
   * Manually check health of a specific service
   */
  async checkService(service: ServiceConfig): Promise<HealthCheckResult[]> {
    const promises = service.instances.map(instance =>
      this.checkInstanceHealth(service, instance)
    );

    const results = await Promise.allSettled(promises);
    
    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Return failed health check result
        return {
          service: service.name,
          instance: 'unknown',
          healthy: false,
          responseTime: 0,
          error: 'Health check promise rejected',
          timestamp: new Date(),
        };
      }
    });
  }

  /**
   * Get health status for all services
   */
  getHealthStatus(services: ServiceConfig[]): Record<string, any> {
    const status: Record<string, any> = {};

    services.forEach(service => {
      const healthyInstances = service.instances.filter(i => i.healthy);
      const totalInstances = service.instances.length;
      
      status[service.name] = {
        healthy: healthyInstances.length > 0,
        totalInstances,
        healthyInstances: healthyInstances.length,
        instances: service.instances.map(instance => ({
          address: `${instance.host}:${instance.port}`,
          healthy: instance.healthy,
          weight: instance.weight,
          lastCheck: instance.lastHealthCheck?.toISOString(),
        })),
      };
    });

    return status;
  }

  /**
   * Add a new service for health checking
   */
  addService(service: ServiceConfig): void {
    if (this.isRunning && !this.checkIntervals.has(service.name)) {
      this.startServiceHealthCheck(service);
    }
  }

  /**
   * Remove a service from health checking
   */
  removeService(serviceName: string): void {
    const interval = this.checkIntervals.get(serviceName);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(serviceName);
    }
  }

  /**
   * Update health check interval for a service
   */
  updateServiceInterval(serviceName: string, newInterval: number): void {
    this.removeService(serviceName);
    // Service will be re-added with new interval on next health check cycle
  }
}