import client from 'prom-client';

export class MetricsService {
  private static registry = new client.Registry();
  private static counters = new Map<string, client.Counter<string>>();
  private static histograms = new Map<string, client.Histogram<string>>();
  private static gauges = new Map<string, client.Gauge<string>>();

  static initialize() {
    // Collect default Node.js metrics
    client.collectDefaultMetrics({ register: this.registry });

    // Create custom metrics
    this.createCounter('gateway_requests_total', 'Total number of gateway requests', [
      'method',
      'status',
      'service',
    ]);

    this.createHistogram('gateway_request_duration_ms', 'Request duration in milliseconds', [
      'method',
      'status',
      'service',
    ], [1, 5, 15, 50, 100, 500, 1000, 5000]);

    this.createGauge('gateway_active_connections', 'Number of active connections');

    this.createGauge('gateway_service_health', 'Service health status (1=healthy, 0=unhealthy)', [
      'service',
    ]);

    console.log('📊 Metrics initialized successfully');
  }

  private static createCounter(name: string, help: string, labelNames: string[] = []) {
    const counter = new client.Counter({
      name,
      help,
      labelNames,
      registers: [this.registry],
    });
    this.counters.set(name, counter);
    return counter;
  }

  private static createHistogram(
    name: string, 
    help: string, 
    labelNames: string[] = [], 
    buckets?: number[]
  ) {
    const histogram = new client.Histogram({
      name,
      help,
      labelNames,
      buckets,
      registers: [this.registry],
    });
    this.histograms.set(name, histogram);
    return histogram;
  }

  private static createGauge(name: string, help: string, labelNames: string[] = []) {
    const gauge = new client.Gauge({
      name,
      help,
      labelNames,
      registers: [this.registry],
    });
    this.gauges.set(name, gauge);
    return gauge;
  }

  static incrementCounter(name: string, labels: Record<string, string> = {}) {
    const counter = this.counters.get(name);
    if (counter) {
      counter.inc(labels);
    }
  }

  static recordHistogram(name: string, value: number, labels: Record<string, string> = {}) {
    const histogram = this.histograms.get(name);
    if (histogram) {
      histogram.observe(labels, value);
    }
  }

  static setGauge(name: string, value: number, labels: Record<string, string> = {}) {
    const gauge = this.gauges.get(name);
    if (gauge) {
      gauge.set(labels, value);
    }
  }

  static incrementGauge(name: string, value: number = 1, labels: Record<string, string> = {}) {
    const gauge = this.gauges.get(name);
    if (gauge) {
      gauge.inc(labels, value);
    }
  }

  static decrementGauge(name: string, value: number = 1, labels: Record<string, string> = {}) {
    const gauge = this.gauges.get(name);
    if (gauge) {
      gauge.dec(labels, value);
    }
  }

  static async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  static getRegistry() {
    return this.registry;
  }
}