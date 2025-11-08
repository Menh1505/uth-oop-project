import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { config } from './config';

// Create Jaeger exporter for distributed tracing
const jaegerExporter = new JaegerExporter({
  endpoint: config.observability.jaegerEndpoint,
});

// Create Prometheus exporter for metrics
const prometheusExporter = new PrometheusExporter({
  port: config.observability.prometheusPort,
  endpoint: '/metrics',
});

// Initialize OpenTelemetry SDK
export const sdk = new NodeSDK({
  serviceName: config.observability.serviceName,
  serviceVersion: config.observability.serviceVersion,
  traceExporter: jaegerExporter,
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable fs instrumentation to reduce noise
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

// Initialize the SDK
sdk.start();

console.log(`🔍 OpenTelemetry initialized for ${config.observability.serviceName}`);
console.log(`📊 Metrics available at http://localhost:${config.observability.prometheusPort}/metrics`);
console.log(`🔗 Traces exported to ${config.observability.jaegerEndpoint}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('🔍 OpenTelemetry SDK terminated'))
    .catch((error) => console.log('❌ Error terminating OpenTelemetry SDK', error))
    .finally(() => process.exit(0));
});