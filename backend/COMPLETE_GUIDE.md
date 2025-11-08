# FitFood Backend - Microservices Architecture

> Complete microservices architecture for FitFood e-commerce platform with observability stack

## 🏗️ Architecture Overview

### Services
- **🔐 Auth Service** (`port 3011`) - Authentication & authorization
- **👤 User Service** (`port 3012`) - User profile management  
- **⚙️ Admin Service** (`port 3013`) - System administration
- **📦 Catalog Service** (`port 3014`) - Product catalog & inventory
- **🌐 Gateway Service** (`port 3000`) - API Gateway with routing & observability

### Infrastructure
- **🐳 PostgreSQL** - Database per service pattern
- **🐰 RabbitMQ** - Event-driven messaging
- **📊 Prometheus** - Metrics collection
- **📈 Grafana** - Monitoring dashboards
- **🔍 Jaeger** - Distributed tracing
- **🔄 Nginx** - Reverse proxy (optional)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL client (optional)

### Complete Stack Startup
```bash
# Clone and setup
git clone <repository>
cd backend

# Start all services with observability
chmod +x start-catalog-service.sh
./start-catalog-service.sh
```

### Individual Service Setup
```bash
# Install dependencies for each service
cd auth-service && npm install && npm run build && cd ..
cd user-service && npm install && npm run build && cd ..
cd admin-service && npm install && npm run build && cd ..
cd catalog-service && npm install && npm run build && cd ..
cd gateway-service && npm install && npm run build && cd ..

# Start infrastructure
docker-compose up -d postgres rabbitmq prometheus grafana jaeger

# Start services
docker-compose up -d auth-service user-service admin-service catalog-service gateway-service
```

## 📡 API Endpoints

### Authentication (via Gateway)
```http
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
GET  /api/auth/verify       # Token verification
```

### User Management (via Gateway)
```http
GET  /api/user/profile      # Get user profile
PUT  /api/user/profile      # Update profile
GET  /api/user/orders       # Get user orders
```

### Product Catalog (via Gateway)
```http
GET  /api/catalog/products                    # List products
GET  /api/catalog/products/:id               # Get product details
POST /api/catalog/products                   # Create product (admin)
PUT  /api/catalog/products/:id               # Update product (admin)
DELETE /api/catalog/products/:id             # Delete product (admin)

GET  /api/catalog/categories                 # List categories
GET  /api/catalog/categories/:id             # Get category
POST /api/catalog/categories                 # Create category (admin)
PUT  /api/catalog/categories/:id             # Update category (admin)

GET  /api/catalog/inventory/:productId       # Get inventory
PUT  /api/catalog/inventory/:productId       # Update inventory (admin)
POST /api/catalog/inventory/reserve          # Reserve inventory
```

### Administration (via Gateway)
```http
GET  /api/admin/users       # List all users
GET  /api/admin/stats       # System statistics
GET  /api/admin/health      # System health
```

## 🏗️ Clean Architecture Implementation

### Catalog Service Structure
```
catalog-service/
├── src/
│   ├── controllers/        # HTTP request handlers
│   │   └── CatalogController.ts
│   ├── services/          # Business logic layer
│   │   └── CatalogService.ts
│   ├── models/           # Domain models & interfaces
│   │   ├── Product.ts
│   │   ├── Category.ts
│   │   └── Inventory.ts
│   ├── middleware/       # Cross-cutting concerns
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── metricsMiddleware.ts
│   ├── routes/          # Route definitions
│   │   └── catalogRoutes.ts
│   ├── config/          # Configuration & external services
│   │   ├── database.ts
│   │   ├── rabbitmq.ts
│   │   ├── jwt.ts
│   │   └── telemetry.ts
│   ├── app.ts          # Express app configuration
│   └── server.ts       # Application entry point
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

### Gateway Service Architecture
```
gateway-service/
├── src/
│   ├── controllers/
│   │   └── GatewayController.ts
│   ├── services/
│   │   ├── GatewayService.ts    # Core routing logic
│   │   └── MetricsService.ts    # Metrics collection
│   ├── models/
│   │   └── Gateway.ts           # Request/response interfaces
│   ├── middleware/
│   │   ├── authMiddleware.ts    # JWT validation
│   │   ├── rateLimitMiddleware.ts
│   │   └── corsMiddleware.ts
│   ├── routes/
│   │   └── gatewayRoutes.ts
│   ├── config/
│   │   ├── config.ts           # Service URLs & settings
│   │   └── telemetry.ts        # OpenTelemetry setup
│   └── app.ts
└── server.ts
```

## 📊 Observability Stack

### Metrics Collection (Prometheus)
- **HTTP Request Metrics**: Rate, duration, status codes
- **Business Metrics**: Product views, cart operations, order processing
- **System Metrics**: Database connections, queue depth, error rates
- **Custom Metrics**: Inventory levels, low stock alerts

### Distributed Tracing (Jaeger)
- **Service Dependencies**: Visualize service interactions
- **Request Flow**: Track requests across microservices
- **Performance Bottlenecks**: Identify slow operations
- **Error Propagation**: Debug issues across services

### Monitoring Dashboards (Grafana)
- **Service Health**: Real-time service status
- **Performance Metrics**: Response times, throughput
- **Business KPIs**: Product catalog metrics, user activity
- **Infrastructure**: Database, queue, and system metrics

## 🗄️ Database Schema

### Auth Service (auth_db)
```sql
users          # User authentication data
roles          # User roles and permissions
sessions       # Active user sessions
```

### User Service (user_db)  
```sql
user_profiles  # Extended user information
user_preferences # User settings and preferences
user_addresses   # Shipping addresses
```

### Catalog Service (catalog_db)
```sql
categories     # Product categories with hierarchy
products       # Product information and metadata
inventory      # Stock levels and reservations
```

### Admin Service (admin_db)
```sql
admin_users    # Administrative users
system_logs    # System activity logs
configurations # System settings
```

## 🚢 Docker Deployment

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/service_db

# JWT
JWT_SECRET=your-secure-secret-key

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672

# Observability
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
PROMETHEUS_PORT=9464

# Service URLs (Gateway)
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
ADMIN_SERVICE_URL=http://admin-service:3003
CATALOG_SERVICE_URL=http://catalog-service:3003
```

### Production Build
```bash
# Build all services
docker-compose build

# Deploy with production config
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale catalog-service=3 --scale gateway-service=2
```

## 📈 Monitoring URLs

| Service | URL | Description |
|---------|-----|-------------|
| Gateway | http://localhost:3000 | Main API Gateway |
| Prometheus | http://localhost:9090 | Metrics & Alerting |
| Grafana | http://localhost:3001 | Monitoring Dashboards |
| Jaeger | http://localhost:16686 | Distributed Tracing |
| RabbitMQ | http://localhost:15672 | Message Queue Management |

### Grafana Dashboards
- **Gateway Service**: Request rates, response times, routing metrics
- **Catalog Service**: Product operations, inventory levels, search performance
- **Auth Service**: Login rates, token validation, security metrics
- **System Overview**: Cross-service health, database performance

## 🔧 Development

### Local Development
```bash
# Start infrastructure only
docker-compose up -d postgres rabbitmq prometheus grafana jaeger

# Run services locally
cd catalog-service && npm run dev
cd gateway-service && npm run dev
# ... other services
```

### Testing
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# API testing with sample data
curl -X GET http://localhost:3000/api/catalog/products
curl -X POST http://localhost:3000/api/catalog/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Test Product","description":"Test","price":9.99,"categoryId":"<category-id>"}'
```

## 🔒 Security Features

- **JWT Authentication**: Stateless token-based auth
- **Role-Based Access Control**: Admin, manager, user roles
- **Rate Limiting**: Request throttling per IP/user
- **Input Validation**: Request sanitization
- **CORS Configuration**: Cross-origin request control
- **Security Headers**: Helmet.js security middleware

## 📚 API Documentation

### Product Search with Filters
```http
GET /api/catalog/products?categoryId=<id>&minPrice=10&maxPrice=50&search=healthy&limit=20&offset=0
```

### Inventory Management
```http
PUT /api/catalog/inventory/<productId>
Content-Type: application/json
Authorization: Bearer <token>

{
  "quantity": 100,
  "lowStockThreshold": 10,
  "restockDate": "2024-02-01"
}
```

### Bulk Inventory Reservation
```http
POST /api/catalog/inventory/reserve
Content-Type: application/json
Authorization: Bearer <token>

{
  "reservations": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "reservationId": "order-uuid"
    }
  ]
}
```

## 🚨 Troubleshooting

### Common Issues
1. **Service Discovery**: Ensure all services can reach each other via Docker network
2. **Database Migrations**: Run SQL migrations after PostgreSQL starts
3. **RabbitMQ Connections**: Check network connectivity and credentials
4. **Memory Issues**: Increase Docker memory limits for development

### Debugging
```bash
# Check service logs
docker-compose logs -f catalog-service

# Database connectivity
docker-compose exec postgres psql -U postgres -d catalog_db -c "SELECT COUNT(*) FROM products;"

# RabbitMQ queue status
curl -u admin:admin http://localhost:15672/api/queues

# Health checks
curl http://localhost:3000/health
curl http://localhost:3014/health
```

## 🎯 Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: PostgreSQL connection management
- **Caching Strategy**: Redis integration ready
- **Load Balancing**: Multiple service instances support
- **Async Processing**: Event-driven architecture with RabbitMQ

## 📝 Contributing

1. Follow Clean Architecture principles
2. Add comprehensive tests for new features
3. Update OpenAPI documentation
4. Include metrics and tracing for new endpoints
5. Follow TypeScript strict mode conventions

## 📄 License

MIT License - see LICENSE file for details