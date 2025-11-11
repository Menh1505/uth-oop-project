// src/config/telemetry.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { config } from './config';

// ---- Normalize config ----
const serviceName = config.observability.serviceName ?? 'gateway-service';
const serviceVersion = config.observability.serviceVersion ?? 'dev';

const prometheusPort: number =
  typeof config.observability.prometheusPort === 'string'
    ? parseInt(config.observability.prometheusPort, 10)
    : (config.observability.prometheusPort ?? 9464);

// ✅ Để SDK tự tạo Resource từ env:
process.env.OTEL_SERVICE_NAME = serviceName;
process.env.OTEL_SERVICE_VERSION = serviceVersion;

// ---- Exporters ----
const jaegerExporter = new JaegerExporter({
  // ví dụ: 'http://localhost:14268/api/traces'
  endpoint: config.observability.jaegerEndpoint,
});

// PrometheusExporter là MetricReader ở các bản mới
const prometheusReader = new PrometheusExporter({
  port: prometheusPort,
  endpoint: '/metrics',
});

// ---- SDK ----
export const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  metricReader: prometheusReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

// ---- Start (tương thích cả bản trả void lẫn Promise) ----
(async () => {
  try {
    await (sdk.start() as unknown as Promise<void> | void);
    console.log(`🔍 OpenTelemetry initialized for ${serviceName} v${serviceVersion}`);
    console.log(`📊 Metrics at http://localhost:${prometheusPort}/metrics`);
    console.log(`🔗 Traces exported to ${config.observability.jaegerEndpoint}`);
  } catch (err) {
    console.error('❌ Error starting OpenTelemetry SDK', err);
  }
})();

// ---- Graceful shutdown ----
process.on('SIGTERM', () => {
  Promise.resolve(sdk.shutdown() as unknown as Promise<void> | void)
    .then(() => console.log('🔍 OpenTelemetry SDK terminated'))
    .catch((error) => console.log('❌ Error terminating OpenTelemetry SDK', error))
    .finally(() => process.exit(0));
});
