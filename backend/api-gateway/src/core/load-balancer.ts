import { ServiceInstance, LoadBalancingStrategy } from '../types';

/**
 * Round Robin load balancing strategy
 * Distributes requests evenly across healthy instances
 */
export class RoundRobinStrategy implements LoadBalancingStrategy {
  private currentIndex = 0;

  select(instances: ServiceInstance[]): ServiceInstance | null {
    const healthyInstances = instances.filter(instance => instance.healthy);
    
    if (healthyInstances.length === 0) {
      return null;
    }

    if (this.currentIndex >= healthyInstances.length) {
      this.currentIndex = 0;
    }

    const selectedInstance = healthyInstances[this.currentIndex] ?? null;
    this.currentIndex = (this.currentIndex + 1) % healthyInstances.length;
    
    return selectedInstance;
  }
}

/**
 * Weighted Round Robin load balancing strategy
 * Distributes requests based on instance weights
 */
export class WeightedRoundRobinStrategy implements LoadBalancingStrategy {
  private currentWeights: Map<string, number> = new Map();

  select(instances: ServiceInstance[]): ServiceInstance | null {
    const healthyInstances = instances.filter(instance => instance.healthy);
    
    if (healthyInstances.length === 0) {
      return null;
    }

    // Initialize weights if not exists
    healthyInstances.forEach(instance => {
      const key = `${instance.host}:${instance.port}`;
      if (!this.currentWeights.has(key)) {
        this.currentWeights.set(key, 0);
      }
    });

    // Find instance with highest current weight
    let selectedInstance: ServiceInstance | null = null;
    let maxCurrentWeight = -1;

    healthyInstances.forEach(instance => {
      const key = `${instance.host}:${instance.port}`;
      let currentWeight = this.currentWeights.get(key) || 0;
      currentWeight += instance.weight;
      this.currentWeights.set(key, currentWeight);

      if (currentWeight > maxCurrentWeight) {
        maxCurrentWeight = currentWeight;
        selectedInstance = instance;
      }
    });

    // Reduce the current weight of selected instance
    if (selectedInstance) {
      const key = `${selectedInstance.host}:${selectedInstance.port}`;
      const totalWeight = healthyInstances.reduce((sum, inst) => sum + inst.weight, 0);
      const currentWeight = this.currentWeights.get(key) || 0;
      this.currentWeights.set(key, currentWeight - totalWeight);
    }

    return selectedInstance;
  }
}

/**
 * Least Connections load balancing strategy
 * Routes to the instance with the fewest active connections
 */
export class LeastConnectionsStrategy implements LoadBalancingStrategy {
  private activeConnections: Map<string, number> = new Map();

  select(instances: ServiceInstance[]): ServiceInstance | null {
    const healthyInstances = instances.filter(instance => instance.healthy);
    
    if (healthyInstances.length === 0) {
      return null;
    }

    if (healthyInstances.length === 1) {
      return healthyInstances[0] ?? null;
    }

    // Find instance with least connections
    let selectedInstance = healthyInstances[0];
    let minConnections = this.getConnectionCount(selectedInstance!);

    healthyInstances.forEach(instance => {
      const connections = this.getConnectionCount(instance);
      if (connections < minConnections) {
        minConnections = connections;
        selectedInstance = instance;
      }
    });

    // Increment connection count for selected instance
    if (selectedInstance) {
      const key = `${selectedInstance.host}:${selectedInstance.port}`;
      this.activeConnections.set(key, (this.activeConnections.get(key) || 0) + 1);
    }

    return selectedInstance ?? null;
  }

  private getConnectionCount(instance: ServiceInstance): number {
    const key = `${instance.host}:${instance.port}`;
    return this.activeConnections.get(key) || 0;
  }

  /**
   * Call this method when a request is completed to decrease connection count
   */
  releaseConnection(instance: ServiceInstance): void {
    const key = `${instance.host}:${instance.port}`;
    const currentCount = this.activeConnections.get(key) || 0;
    if (currentCount > 0) {
      this.activeConnections.set(key, currentCount - 1);
    }
  }
}

/**
 * Load Balancer class that manages different strategies
 */
export class LoadBalancer {
  private strategy: LoadBalancingStrategy;

  constructor(strategyType: 'round-robin' | 'weighted' | 'least-connections' = 'round-robin') {
    switch (strategyType) {
      case 'weighted':
        this.strategy = new WeightedRoundRobinStrategy();
        break;
      case 'least-connections':
        this.strategy = new LeastConnectionsStrategy();
        break;
      default:
        this.strategy = new RoundRobinStrategy();
    }
  }

  selectInstance(instances: ServiceInstance[]): ServiceInstance | null {
    return this.strategy.select(instances);
  }

  setStrategy(strategy: LoadBalancingStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Update instance health status
   */
  updateInstanceHealth(instances: ServiceInstance[], host: string, port: number, healthy: boolean): void {
    const instance = instances.find(inst => inst.host === host && inst.port === port);
    if (instance) {
      instance.healthy = healthy;
      instance.lastHealthCheck = new Date();
    }
  }
}