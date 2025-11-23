# Architecture Documentation

## 🏗️ Tổng quan kiến trúc

Hệ thống được thiết kế theo mô hình **Microservices Architecture** với các nguyên tắc:

- **Separation of Concerns**: Mỗi service có trách nhiệm riêng biệt
- **Independent Deployment**: Các service có thể deploy độc lập
- **Technology Diversity**: Mỗi service có thể sử dụng công nghệ phù hợp
- **Fault Isolation**: Lỗi ở một service không ảnh hưởng đến toàn hệ thống

## 📊 Service Communication

### 1. Synchronous Communication (HTTP REST)

```
Client → Nginx → [Auth/User/Admin Service] → Response
```

- **Protocol**: HTTP/HTTPS
- **Format**: JSON
- **Use case**: Real-time queries, CRUD operations

### 2. Asynchronous Communication (Message Queue)

```
Service A → RabbitMQ → Service B
```

- **Protocol**: AMQP
- **Pattern**: Event-driven architecture
- **Use case**: Background processing, notifications

## 🔐 Authentication & Authorization

### JWT Token Flow

```
1. User → Auth Service: login(credentials)
2. Auth Service → Database: validate user
3. Auth Service → User: JWT token
4. User → Other Services: request + JWT token
5. Other Services → Auth Service: validate token (optional)
6. Other Services → User: response
```

### Role-Based Access Control (RBAC)

```sql
-- Roles
admin     - Full system access
user      - Basic user operations
moderator - Content moderation

-- Permissions
user.read   - Read user profiles
user.write  - Modify user profiles  
admin.read  - Access admin features
admin.write - Modify admin settings
```

## 🗄️ Database Design

### Database per Service Pattern

```
auth-service    → auth_db    (Users, Roles, Permissions)
user-service    → user_db    (Profiles, Preferences)
admin-service   → admin_db   (Logs, Reports, Settings)
```

### Schema Overview

#### auth_db
```sql
users_auth       -- Core user identity
roles           -- System roles
permissions     -- Fine-grained permissions
user_roles      -- User-role mapping
sessions        -- Active sessions
token_blacklist -- Revoked tokens
```

#### user_db
```sql
users           -- User profiles
user_preferences -- User settings
user_activities -- Activity logs
```

#### admin_db
```sql
admin_logs      -- System audit logs
admin_reports   -- Generated reports
admin_settings  -- System configuration
admin_jobs      -- Background jobs
```

## 📨 Message Patterns

### Event Types

```javascript
// User Events
'user.created'    // New user registration
'user.updated'    // Profile updates
'user.deleted'    // Account deletion
'user.logged_in'  // Login events

// System Events  
'system.backup'   // Database backup
'system.alert'    // System alerts
'report.generated' // Report creation
```

### Message Structure

```javascript
{
  "eventType": "user.created",
  "timestamp": "2025-11-07T10:00:00Z",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "metadata": {...}
  },
  "source": "auth-service",
  "correlationId": "uuid"
}
```

## 🔄 Data Flow Examples

### User Registration Flow

```
1. POST /api/auth/register
   └── Nginx → Auth Service

2. Auth Service:
   ├── Validate input
   ├── Hash password
   ├── Save to auth_db
   └── Publish 'user.created' event

3. User Service (subscribes to 'user.created'):
   ├── Create user profile
   ├── Set default preferences
   └── Save to user_db

4. Admin Service (subscribes to 'user.created'):
   ├── Log registration event
   ├── Update user statistics
   └── Save to admin_db
```

### User Login Flow

```
1. POST /api/auth/login
   └── Nginx → Auth Service

2. Auth Service:
   ├── Validate credentials
   ├── Generate JWT token
   ├── Create session record
   ├── Publish 'user.logged_in' event
   └── Return token

3. User Service (subscribes to 'user.logged_in'):
   ├── Update last login time
   └── Log activity

4. Admin Service (subscribes to 'user.logged_in'):
   ├── Update login statistics
   └── Security monitoring
```

## 🚪 API Gateway (Nginx)

### Routing Rules

```nginx
location /api/auth/ {
    proxy_pass http://auth-service:3001/;
}

location /api/user/ {
    proxy_pass http://user-service:3002/;
}

location /api/admin/ {
    proxy_pass http://admin-service:3003/;
}
```

### Features

- **Load Balancing**: Distribute requests across instances
- **SSL Termination**: Handle HTTPS encryption
- **Request Logging**: Log all API requests
- **Rate Limiting**: Prevent API abuse
- **CORS Handling**: Cross-origin request support

## 🐳 Containerization Strategy

### Multi-stage Builds

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
```

### Container Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## 📈 Scalability Considerations

### Horizontal Scaling

```yaml
# Scale specific service
docker compose up --scale user-service=3

# Load balancer will distribute requests
nginx → [user-service-1, user-service-2, user-service-3]
```

### Database Scaling

- **Read Replicas**: For read-heavy workloads
- **Sharding**: For write-heavy workloads
- **Connection Pooling**: Optimize database connections

### Caching Strategy

```
Application → Redis Cache → Database
                ↓
         Cache Hit/Miss Logic
```

## 🔍 Monitoring & Observability

### Logging Strategy

```javascript
// Structured logging
logger.info('User login attempt', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  timestamp: new Date().toISOString()
});
```

### Health Checks

```
GET /health → Service health status
GET /metrics → Prometheus metrics
GET /info → Service information
```

### Distributed Tracing

```
Request ID: abc-123
├── Nginx (5ms)
├── Auth Service (50ms)
│   └── Database Query (30ms)
└── Response (total: 55ms)
```

## 🛡️ Security Considerations

### Authentication

- JWT tokens with expiration
- Refresh token rotation
- Token blacklisting for logout

### Authorization

- Role-based access control
- Resource-level permissions
- API endpoint protection

### Data Protection

- Password hashing (bcrypt)
- SQL injection prevention
- Input validation & sanitization
- CORS configuration

## 🔄 Development Workflow

### Local Development

```bash
# Start dependencies only
docker compose up postgres rabbitmq -d

# Run services in development mode
npm run dev  # Each service individually
```

### Testing Strategy

```
├── Unit Tests     # Individual functions
├── Integration    # Service interactions  
├── E2E Tests     # Full workflow
└── Load Tests    # Performance testing
```

### CI/CD Pipeline

```
1. Code Commit → Git
2. Automated Tests
3. Build Docker Images
4. Deploy to Staging
5. Integration Tests
6. Deploy to Production
```

## 🚀 Deployment Options

### Docker Swarm

```yaml
version: '3.8'
services:
  auth-service:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
```

### Cloud Deployment

- **AWS**: ECS, EKS, RDS, ElastiCache
- **GCP**: Cloud Run, GKE, Cloud SQL
- **Azure**: Container Instances, AKS

## 📋 Best Practices

### Code Organization

```
src/
├── controllers/    # HTTP request handlers
├── services/      # Business logic
├── models/        # Data models
├── middleware/    # Request middleware
├── routes/        # API routes
├── config/        # Configuration
└── utils/         # Utility functions
```

### Error Handling

```javascript
// Centralized error handling
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    requestId: req.id
  });
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.id
  });
});
```

### Configuration Management

```javascript
// Environment-based configuration
const config = {
  development: {
    database: 'postgresql://localhost:5432/dev_db',
    logLevel: 'debug'
  },
  production: {
    database: process.env.DATABASE_URL,
    logLevel: 'info'
  }
}[process.env.NODE_ENV || 'development'];
```

## 🔮 Future Enhancements

### Planned Features

- **API Versioning**: v1, v2 endpoint support
- **GraphQL Gateway**: Alternative to REST
- **Event Sourcing**: Audit trail with events
- **CQRS**: Command Query Responsibility Segregation
- **Circuit Breaker**: Fault tolerance patterns
- **Distributed Cache**: Redis cluster
- **Metrics Dashboard**: Grafana + Prometheus
- **Service Mesh**: Istio for advanced networking