# UTH API Gateway

A high-performance, enterprise-grade API Gateway built with Node.js and TypeScript to replace NGINX in the UTH OOP Food Delivery Platform. This custom gateway provides advanced features including intelligent load balancing, circuit breakers, rate limiting, health checks, and comprehensive monitoring.

## 🚀 Features

### Core Capabilities
- **Intelligent Routing**: Route requests to appropriate backend services with path rewriting and method filtering
- **Load Balancing**: Multiple strategies including Round Robin, Weighted Round Robin, and Least Connections
- **Circuit Breakers**: Automatic service failure detection and recovery with configurable thresholds
- **Rate Limiting**: Per-IP, per-user, and per-route rate limiting with Redis backend
- **Health Checks**: Automated service health monitoring with configurable intervals
- **WebSocket Support**: Full duplex communication for real-time features

### Security & Performance
- **Security Headers**: Automatic security headers via Helmet.js
- **CORS Support**: Configurable Cross-Origin Resource Sharing
- **Compression**: Gzip/Deflate compression for responses
- **Caching**: Intelligent response caching with TTL and cache invalidation
- **Request/Response Logging**: Structured logging with request tracing
- **Metrics & Monitoring**: Prometheus-compatible metrics endpoint

### Enterprise Features
- **Graceful Shutdown**: Clean shutdown with connection draining
- **Configuration Management**: Dynamic configuration with environment variables
- **Service Discovery**: Optional Consul integration for service discovery
- **Horizontal Scaling**: Stateless design for easy horizontal scaling
- **Error Handling**: Comprehensive error handling with custom error pages

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   API Gateway   │    │   Microservices │
│                 │────│                 │────│                 │
│  (External LB)  │    │  (This Service) │    │   (Backend APIs)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │      Redis      │
                    │   (Rate Limit   │
                    │   & Caching)    │
                    └─────────────────┘
```

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Fastify (high-performance HTTP framework)
- **Proxy**: Custom HTTP proxy implementation
- **Storage**: Redis for rate limiting, caching, and session storage
- **Monitoring**: Prometheus metrics, structured logging
- **Security**: Helmet.js, custom CORS handling
- **Service Discovery**: Optional Consul integration

## 📦 Installation

### Prerequisites
- Node.js 18+
- Redis
- Docker (optional)

### Local Development

1. **Clone and setup**:
```bash
cd api-gateway
npm install
# or
pnpm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development server**:
```bash
npm run dev
```

### Docker Deployment

1. **Build the image**:
```bash
docker build -t uth-api-gateway .
```

2. **Run with Docker Compose**:
```bash
# Update docker-compose.yml to include the gateway
docker-compose up -d
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GATEWAY_PORT` | Gateway listen port | `8080` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | _(empty)_ |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `CIRCUIT_BREAKER_FAILURE_THRESHOLD` | Circuit breaker failure threshold | `5` |
| `CIRCUIT_BREAKER_RESET_TIMEOUT` | Circuit breaker reset timeout (ms) | `60000` |

### Service Configuration

Services are configured in `src/config.ts`. Each service includes:

```typescript
{
  name: 'auth-service',
  instances: [
    { host: 'auth-service', port: 3001, weight: 1, healthy: true }
  ],
  healthPath: '/health',
  timeout: 30000,
  retryAttempts: 3,
  circuitBreakerEnabled: true,
}
```

### Route Configuration

Routes define how requests are proxied to services:

```typescript
{
  path: '/api/auth',
  service: 'auth-service',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  rateLimitConfig: {
    max: 5,
    timeWindow: '1 minute',
    keyGenerator: 'ip'
  },
  authRequired: false,
  stripPath: true,
}
```

## 🔧 Load Balancing Strategies

### Round Robin (Default)
Distributes requests evenly across all healthy instances.

### Weighted Round Robin
Distributes requests based on instance weights, allowing for different instance capacities.

### Least Connections
Routes requests to the instance with the fewest active connections.

## 🛡️ Circuit Breakers

Circuit breakers prevent cascading failures by automatically stopping requests to unhealthy services.

**States**:
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Service is unhealthy, requests are blocked
- **HALF_OPEN**: Testing if service has recovered

**Configuration**:
```typescript
{
  failureThreshold: 5,      // Failures before opening
  resetTimeout: 60000,      // Time before retry (ms)
  monitoringPeriod: 300000, // Monitoring window (ms)
}
```

## 📊 Monitoring & Observability

### Health Check Endpoint
```bash
GET /health
```
Returns overall system health and individual service status.

### Metrics Endpoint
```bash
GET /metrics
```
Prometheus-compatible metrics including:
- Request count and rate
- Response times (percentiles)
- Error rates
- Circuit breaker states
- Active connections

### Circuit Breaker Status
```bash
GET /admin/circuit-breakers
```
Real-time circuit breaker states for all services.

### Logging

Structured JSON logging with the following fields:
- `request_id`: Unique request identifier
- `method`: HTTP method
- `url`: Request URL
- `status_code`: Response status
- `response_time`: Request duration (ms)
- `ip`: Client IP address
- `user_agent`: Client user agent

## 🚦 Rate Limiting

### Global Rate Limiting
- Default: 1000 requests per minute per IP
- Configurable via environment variables

### Service-Specific Rate Limiting
Different limits for different services:
- Auth services: 5 req/min (stricter for security)
- General APIs: 50 req/min
- High-throughput APIs: 100 req/min

### Key Strategies
- **IP-based**: Rate limit by client IP
- **User-based**: Rate limit by authenticated user
- **Custom**: Custom key generation logic

## 🔄 WebSocket Support

The gateway supports WebSocket connections for real-time features:

- **Delivery Tracking**: `/ws/delivery/*`
- **Notifications**: `/ws/notifications/*`

WebSocket connections are properly proxied to backend services with:
- Connection upgrade handling
- Proper header forwarding
- Graceful connection management

## 🧪 Testing

### Manual Testing
```bash
# Run the test script
./test.sh
```

### Load Testing
```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:8080/health

# Artillery
artillery quick --count 100 --num 10 http://localhost:8080/health
```

### Health Check Testing
```bash
# Check gateway health
curl http://localhost:8080/health

# Check specific service routing
curl http://localhost:8080/api/auth/health
```

## 🔧 Migration from NGINX

### 1. Update Docker Compose

Replace NGINX service with the API Gateway:

```yaml
api-gateway:
  build: ./api-gateway
  ports:
    - "80:8080"
  environment:
    - REDIS_HOST=redis
    - NODE_ENV=production
  depends_on:
    - redis
    - auth-service
    - user-service
    # ... other services
```

### 2. Update Service Configuration

Ensure all microservices expose health check endpoints at `/health`.

### 3. Configure Load Balancer

If using an external load balancer, configure it to route traffic to multiple gateway instances.

## 📈 Performance Optimization

### Horizontal Scaling

The gateway is stateless and can be scaled horizontally:

```yaml
api-gateway:
  build: ./api-gateway
  deploy:
    replicas: 3
  environment:
    - REDIS_HOST=redis
```

### Caching Strategy

- **Response Caching**: Cache GET responses with configurable TTL
- **Connection Pooling**: Reuse connections to backend services
- **Keep-Alive**: Enable HTTP keep-alive for better performance

### Memory Management

- **Connection Limits**: Limit concurrent connections per service
- **Memory Monitoring**: Monitor memory usage and garbage collection
- **Resource Cleanup**: Proper cleanup of resources and timers

## 🔒 Security Best Practices

### Request Security
- Input validation and sanitization
- Security headers via Helmet.js
- Rate limiting to prevent abuse
- Request size limits

### Service Communication
- Internal service authentication
- Request/response encryption (optional)
- Service-to-service rate limiting

### Monitoring Security
- Failed authentication tracking
- Suspicious activity detection
- IP blocklist support

## 🐛 Troubleshooting

### Common Issues

1. **Service Unavailable (503)**
   - Check if backend services are running
   - Verify service configuration
   - Check circuit breaker status

2. **Rate Limit Exceeded (429)**
   - Review rate limiting configuration
   - Check Redis connectivity
   - Monitor request patterns

3. **High Response Times**
   - Check backend service health
   - Review load balancing strategy
   - Monitor resource usage

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm start
```

### Health Monitoring

Monitor the health endpoint regularly:
```bash
watch -n 5 curl -s http://localhost:8080/health | jq
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Fastify**: High-performance web framework
- **NGINX**: Inspiration for routing and load balancing features
- **Node.js Community**: Ecosystem and best practices
- **UTH OOP Team**: Requirements and testing