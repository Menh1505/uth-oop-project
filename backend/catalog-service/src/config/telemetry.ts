import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export function initTelemetry() {
  // Jaeger exporter for traces
  const jaegerExporter = new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
  });

  // Prometheus exporter for metrics
  const prometheusExporter = new PrometheusExporter({
    port: parseInt(process.env.PROMETHEUS_PORT || '9464'),
    endpoint: '/metrics',
  });

  // SDK initialization
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'catalog-service',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    traceExporter: jaegerExporter,
    metricReader: prometheusExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
  });

  // Start the SDK
  sdk.start();
  
  console.log('OpenTelemetry initialized for catalog-service');
}

// Initialize telemetry if this module is imported
if (process.env.NODE_ENV !== 'test') {
  initTelemetry();
}