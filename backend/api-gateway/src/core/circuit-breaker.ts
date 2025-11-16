import { CircuitBreakerState, ServiceInstance } from '../types';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  expectedFailureRate: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    state: 'CLOSED',
    failureCount: 0,
    successCount: 0,
  };

  private config: CircuitBreakerConfig;
  private nextAttempt: number = 0;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      failureThreshold: config?.failureThreshold ?? 5,
      resetTimeout: config?.resetTimeout ?? 60000, // 1 minute
      monitoringPeriod: config?.monitoringPeriod ?? 300000, // 5 minutes
      expectedFailureRate: config?.expectedFailureRate ?? 0.5, // 50%
    };
  }

  /**
   * Check if a request can be made through the circuit breaker
   */
  canExecute(): boolean {
    const now = Date.now();

    switch (this.state.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        if (now >= this.nextAttempt) {
          this.state.state = 'HALF_OPEN';
          this.state.successCount = 0;
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return false;
    }
  }

  /**
   * Record a successful execution
   */
  onSuccess(): void {
    this.state.failureCount = 0;
    this.state.successCount++;

    if (this.state.state === 'HALF_OPEN') {
      // After a successful request in half-open state, close the circuit
      this.state.state = 'CLOSED';
      this.state.successCount = 0;
    }
  }

  /**
   * Record a failed execution
   */
  onFailure(error?: Error): void {
    this.state.failureCount++;
    this.state.lastFailureTime = new Date();

    switch (this.state.state) {
      case 'CLOSED':
        if (this.state.failureCount >= this.config.failureThreshold) {
          this.open();
        }
        break;

      case 'HALF_OPEN':
        this.open();
        break;

      default:
        break;
    }
  }

  /**
   * Force the circuit breaker to open
   */
  private open(): void {
    this.state.state = 'OPEN';
    this.nextAttempt = Date.now() + this.config.resetTimeout;
  }

  /**
   * Get the current state of the circuit breaker
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics() {
    return {
      state: this.state.state,
      failureCount: this.state.failureCount,
      successCount: this.state.successCount,
      lastFailureTime: this.state.lastFailureTime,
      nextAttempt: this.nextAttempt > 0 ? new Date(this.nextAttempt) : null,
      config: this.config,
    };
  }

  /**
   * Reset the circuit breaker to closed state
   */
  reset(): void {
    this.state = {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
    };
    this.nextAttempt = 0;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new Error(`Circuit breaker is OPEN. Next attempt allowed at ${new Date(this.nextAttempt)}`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
}

/**
 * Circuit Breaker Manager for managing multiple service circuit breakers
 */
export class CircuitBreakerManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig;

  constructor(defaultConfig?: Partial<CircuitBreakerConfig>) {
    this.defaultConfig = {
      failureThreshold: defaultConfig?.failureThreshold ?? 5,
      resetTimeout: defaultConfig?.resetTimeout ?? 60000,
      monitoringPeriod: defaultConfig?.monitoringPeriod ?? 300000,
      expectedFailureRate: defaultConfig?.expectedFailureRate ?? 0.5,
    };
  }

  /**
   * Get or create a circuit breaker for a specific service
   */
  getCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    const key = serviceName;
    
    if (!this.circuitBreakers.has(key)) {
      const cbConfig = { ...this.defaultConfig, ...config };
      this.circuitBreakers.set(key, new CircuitBreaker(cbConfig));
    }

    return this.circuitBreakers.get(key)!;
  }

  /**
   * Check if a service can handle requests
   */
  canExecute(serviceName: string): boolean {
    const circuitBreaker = this.getCircuitBreaker(serviceName);
    return circuitBreaker.canExecute();
  }

  /**
   * Record a successful execution for a service
   */
  onSuccess(serviceName: string): void {
    const circuitBreaker = this.getCircuitBreaker(serviceName);
    circuitBreaker.onSuccess();
  }

  /**
   * Record a failed execution for a service
   */
  onFailure(serviceName: string, error?: Error): void {
    const circuitBreaker = this.getCircuitBreaker(serviceName);
    circuitBreaker.onFailure(error);
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((cb, serviceName) => {
      states[serviceName] = cb.getState();
    });
    return states;
  }

  /**
   * Get metrics for all circuit breakers
   */
  getAllMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    this.circuitBreakers.forEach((cb, serviceName) => {
      metrics[serviceName] = cb.getMetrics();
    });
    return metrics;
  }

  /**
   * Reset a specific circuit breaker
   */
  reset(serviceName: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.circuitBreakers.forEach(cb => cb.reset());
  }
}