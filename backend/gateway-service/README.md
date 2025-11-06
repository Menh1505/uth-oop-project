# Gateway Service

API Gateway service với Clean Architecture và Observability Pack (OpenTelemetry/Prometheus/Grafana).

## 🏗️ Features

### Core Features
- **Request Routing**: Forward requests đến các microservices
- **Authentication**: JWT token validation
- **Rate Limiting**: Prevent API abuse
- **Health Checks**: Monitor service availability
- **Error Handling**: Centralized error management

### Observability Pack
- **OpenTelemetry**: Distributed tracing và metrics
- **Prometheus**: Metrics collection và storage
- **Grafana**: Visualization và dashboards
- **Jaeger**: Distributed tracing visualization

## 📊 Architecture

```
Client Request
     │
     ▼
┌─────────────────┐
│ Gateway Service │
│   (Port 3000)   │
├─────────────────┤
│ • Rate Limiting │
│ • Authentication│
│ • Tracing       │
│ • Metrics       │
└─────────┬───────┘
          │
    ┌─────┼─────┐
    ▼     ▼     ▼
┌────────┐ ┌────────┐ ┌────────┐
│Auth    │ │User    │ │Admin   │
│Service │ │Service │ │Service │
│:3001   │ │:3002   │ │:3003   │
└────────┘ └────────┘ └────────┘
```

## 🛠️ Clean Architecture

```
src/
├── controllers/        # HTTP request handlers
│   └── GatewayController.ts
├── services/           # Business logic
│   ├── GatewayService.ts
│   └── MetricsService.ts
├── models/             # Data models
│   └── Gateway.ts
├── middleware/         # Express middleware
│   ├── authMiddleware.ts
│   ├── rateLimitMiddleware.ts
│   └── errorHandler.ts
├── routes/             # API routes
│   └── gatewayRoutes.ts
├── config/             # Configuration
│   ├── config.ts
│   └── telemetry.ts
└── server.ts           # Application entry point
```

## 📈 Observability Features

### OpenTelemetry Instrumentation
- **Auto-instrumentation**: Express, HTTP, và Node.js modules
- **Custom spans**: Request routing và service calls
- **Trace correlation**: Correlation IDs across services

### Prometheus Metrics
- `gateway_requests_total`: Total request counter
- `gateway_request_duration_ms`: Request duration histogram
- `gateway_service_health`: Service health status
- `gateway_auth_success_total`: Successful authentications
- `gateway_auth_failures_total`: Failed authentications
- `gateway_rate_limit_exceeded_total`: Rate limit violations

### Grafana Dashboards
- **Request Rate**: Real-time request throughput
- **Response Time**: 95th percentile latency
- **Error Rates**: HTTP status code distribution
- **Service Health**: Microservice availability
- **Memory Usage**: Gateway memory consumption

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=production

# Services
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
ADMIN_SERVICE_URL=http://admin-service:3003

# Security
JWT_SECRET=shared-jwt-secret-key-12345

# Observability
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
PROMETHEUS_PORT=9090

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Service Routes

| Pattern | Target Service | Auth Required |
|---------|----------------|---------------|
| `/api/auth/**` | auth-service | No (except logout) |
| `/api/user/**` | user-service | Yes |
| `/api/admin/**` | admin-service | Yes |

## 🚀 API Endpoints

### Gateway Management
- `GET /health` - Service health check
- `GET /metrics` - Prometheus metrics
- `GET /info` - Gateway information

### Service Routing
- `ALL /api/auth/**` - Forward to auth-service
- `ALL /api/user/**` - Forward to user-service (authenticated)
- `ALL /api/admin/**` - Forward to admin-service (authenticated)

## 🔍 Monitoring URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Gateway** | http://localhost:3000 | Main API endpoint |
| **Prometheus** | http://localhost:9090 | Metrics collection |
| **Grafana** | http://localhost:3001 | Dashboards (admin/admin) |
| **Jaeger** | http://localhost:16686 | Distributed tracing |

## 📊 Metrics Examples

### Request Rate
```promql
rate(gateway_requests_total[5m])
```

### Response Time (95th percentile)
```promql
histogram_quantile(0.95, rate(gateway_request_duration_ms_bucket[5m]))
```

### Error Rate
```promql
rate(gateway_requests_total{status!~"2.."}[5m]) / rate(gateway_requests_total[5m])
```

### Service Health
```promql
gateway_service_health
```

## 🛡️ Security Features

### Authentication
- JWT token validation
- Public route exceptions
- User context injection

### Rate Limiting
- IP-based rate limiting
- Configurable windows và limits
- Rate limit metrics

### Request Validation
- Method validation
- Path sanitization
- Header forwarding

## 🔄 Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### With Docker
```bash
# Build image
docker build -t gateway-service .

# Run container
docker run -p 3000:3000 gateway-service
```

## 📝 Logging

### Structured Logging
```javascript
{
  "level": "info",
  "message": "Request processed",
  "method": "GET",
  "path": "/api/user/profile",
  "status": 200,
  "duration": 45,
  "userId": "user-123",
  "traceId": "trace-abc123",
  "timestamp": "2025-11-07T10:30:00Z"
}
```

## 🚨 Alerts

### Recommended Alerting Rules

```yaml
# High error rate
- alert: GatewayHighErrorRate
  expr: rate(gateway_requests_total{status!~"2.."}[5m]) > 0.1
  
# High response time
- alert: GatewayHighLatency
  expr: histogram_quantile(0.95, rate(gateway_request_duration_ms_bucket[5m])) > 1000

# Service down
- alert: ServiceDown
  expr: gateway_service_health == 0
```

## 🤝 Contributing

1. Follow Clean Architecture principles
2. Add tests for new features
3. Update metrics và dashboards
4. Document API changes
5. Test observability features

---

**Built with**: Node.js, Express, OpenTelemetry, Prometheus, Grafana 🚀