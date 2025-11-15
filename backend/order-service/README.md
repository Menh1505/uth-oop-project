# Order Service

Comprehensive order management microservice for food ordering system. This service provides complete order lifecycle management, real-time status tracking, and detailed analytics for restaurant operations.

## 🎯 Features

### Order Management
- **Complete CRUD Operations**: Create, read, update, delete orders
- **Order Lifecycle Tracking**: Full status management from pending to delivered
- **Multiple Delivery Types**: Delivery, pickup, and dine-in support
- **Priority Management**: Low, normal, high, and urgent order priorities
- **Financial Calculations**: Automatic tax, delivery fee, and discount calculations

### Status Management
- **Real-time Status Updates**: Track orders through 8 different states
- **Status History**: Complete audit trail of all status changes
- **Valid Transitions**: Business logic ensures proper status progression
- **Quick Actions**: Cancel, confirm, ready, and delivered shortcuts
- **Automated Timestamps**: Track confirmation, cancellation, and delivery times

### Customer Management
- **Customer Information**: Name, phone, email tracking
- **Delivery Details**: Address, notes, and delivery time preferences
- **Special Instructions**: Custom requests and preparation notes
- **Order History**: Complete customer order history with filtering

### Analytics & Reporting
- **Order Statistics**: Real-time metrics and performance indicators
- **Revenue Tracking**: Total revenue and average order value
- **Status Distribution**: Overview of orders by current status
- **Performance Metrics**: Average preparation time and delivery metrics

## 🏗️ Architecture

The service follows Clean Architecture principles:

```
src/
├── controllers/     # HTTP request handlers and API endpoints
├── services/        # Core business logic and order management
├── models/          # TypeScript interfaces and data models
├── routes/          # API route definitions and middleware
├── middleware/      # Authentication and error handling
├── config/          # Database and JWT configuration
├── app.ts          # Express application setup
└── server.ts       # Server startup and configuration
```

### Key Components

- **OrderController**: REST API endpoints for order management and status updates
- **OrderService**: Core business logic for order lifecycle and calculations
- **Order Models**: Comprehensive TypeScript interfaces for orders, items, and status
- **Database Schema**: Optimized PostgreSQL schema with indexes and constraints

## 📊 Order Lifecycle

### Status Flow
```
PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
    ↓         ↓           ↓         ↓            ↓
CANCELLED ← CANCELLED ← CANCELLED ← CANCELLED ← CANCELLED
    ↓
REFUNDED
```

### Order States
- **PENDING**: Order created, awaiting confirmation
- **CONFIRMED**: Order confirmed, ready for preparation
- **PREPARING**: Food is being prepared in kitchen
- **READY**: Order ready for pickup or delivery
- **OUT_FOR_DELIVERY**: Order dispatched for delivery
- **DELIVERED**: Order successfully delivered to customer
- **CANCELLED**: Order cancelled (can happen at most stages)
- **REFUNDED**: Order refunded after cancellation

### Payment States
- **PENDING**: Payment not yet processed
- **PAID**: Payment successfully completed
- **FAILED**: Payment processing failed
- **REFUNDED**: Payment refunded to customer

## 🚀 API Endpoints

### Order Management
```
POST   /api/orders                    # Create new order
GET    /api/orders                    # List user orders (with filters)
GET    /api/orders/:id                # Get specific order details
PUT    /api/orders/:id                # Update order information
DELETE /api/orders/:id                # Delete order (pending/cancelled only)
```

### Status Management
```
PUT    /api/orders/:id/status         # Update order status
GET    /api/orders/:id/status-history # Get complete status history
POST   /api/orders/:id/cancel         # Cancel order
POST   /api/orders/:id/confirm        # Confirm order (admin)
POST   /api/orders/:id/ready          # Mark order ready
POST   /api/orders/:id/delivered      # Mark order delivered
```

### Analytics & Reporting
```
GET    /api/orders/analytics/stats    # User order statistics
GET    /api/orders/admin/stats        # Global order statistics (admin)
GET    /api/orders/admin/all          # All orders (admin view)
```

### System Endpoints
```
GET    /api/orders/health             # Health check
GET    /                              # Service information and documentation
```

## 📝 Request/Response Examples

### Create Order
```bash
POST /api/orders
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "restaurant_id": "rest-001",
  "delivery_type": "DELIVERY",
  "priority": "NORMAL",
  "customer_name": "Nguyễn Văn An",
  "customer_phone": "0901234567",
  "customer_email": "an@email.com",
  "delivery_address": "123 Nguyễn Thái Sơn, Gò Vấp, TP.HCM",
  "delivery_notes": "Gọi chuông 2 lần",
  "delivery_time": "2024-01-15T19:00:00Z",
  "estimated_prep_time": 30,
  "special_instructions": "Không cay",
  "items": [
    {
      "product_id": "food-001",
      "product_name": "Phở Bò Tái",
      "product_description": "Phở bò tái truyền thống",
      "category": "Phở",
      "unit_price": 65000,
      "quantity": 2,
      "customizations": ["Size lớn", "Thêm rau"],
      "special_requests": "Không hành tây"
    }
  ]
}
```

### Order Response
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "order_number": "ORD202411130001",
    "status": "PENDING",
    "payment_status": "PENDING",
    "delivery_type": "DELIVERY",
    "priority": "NORMAL",
    "subtotal": 130000,
    "tax_amount": 13000,
    "delivery_fee": 25000,
    "discount_amount": 0,
    "total_amount": 168000,
    "customer_name": "Nguyễn Văn An",
    "customer_phone": "0901234567",
    "delivery_address": "123 Nguyễn Thái Sơn, Gò Vấp, TP.HCM",
    "estimated_prep_time": 30,
    "created_at": "2024-01-15T10:30:00Z",
    "items": [
      {
        "id": "item-001",
        "product_id": "food-001",
        "product_name": "Phở Bò Tái",
        "unit_price": 65000,
        "quantity": 2,
        "total_price": 130000,
        "customizations": ["Size lớn", "Thêm rau"]
      }
    ]
  },
  "message": "Order created successfully"
}
```

### Update Order Status
```bash
PUT /api/orders/123e4567-e89b-12d3-a456-426614174000/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "CONFIRMED",
  "reason": "Order confirmed by restaurant"
}
```

### Order Statistics Response
```json
{
  "success": true,
  "data": {
    "total_orders": 156,
    "pending_orders": 12,
    "confirmed_orders": 8,
    "preparing_orders": 15,
    "ready_orders": 3,
    "out_for_delivery_orders": 7,
    "delivered_orders": 98,
    "cancelled_orders": 13,
    "total_revenue": 15680000,
    "average_order_value": 125000,
    "average_prep_time": 28.5
  }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://user:pass@host:5432/order_db
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=order_db
DB_PORT=5432

# Authentication
JWT_SECRET=your-secret-key

# Server Configuration
PORT=3004
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Docker Configuration
```yaml
order-service:
  build: ./order-service
  ports:
    - "3017:3004"
  environment:
    DATABASE_URL: postgresql://postgres:password@postgres:5432/order_db
    JWT_SECRET: shared-secret-key
  depends_on:
    - postgres
```

## 🗄️ Database Schema

### Core Tables

#### Orders Table
- **orders**: Main order information with customer details and status
- **order_items**: Individual items within each order
- **order_status_history**: Complete audit trail of status changes

#### Key Features
- UUID primary keys for security
- Comprehensive indexes for performance
- Check constraints for data validation
- Automatic timestamp updates
- JSONB support for customizations

#### Sample Queries
```sql
-- Get order with items
SELECT o.*, json_agg(oi.*) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = $1
GROUP BY o.id;

-- Order statistics
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered_orders,
  SUM(CASE WHEN status = 'DELIVERED' THEN total_amount ELSE 0 END) as revenue
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
```

## 🧪 Development

### Setup
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

### Database Setup
```bash
# Run migrations
psql -U postgres -d order_db -f migrations/order_db.sql

# Or use Docker Compose (recommended)
docker-compose up postgres
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🔒 Security Features

- **JWT Authentication**: All endpoints require valid authentication tokens
- **User Data Isolation**: Users can only access their own orders
- **Input Validation**: Comprehensive request validation and sanitization
- **Rate Limiting**: Protection against API abuse (100 requests per 15 minutes)
- **Error Handling**: Secure error responses without sensitive data exposure
- **SQL Injection Protection**: Parameterized queries and prepared statements

## 📈 Performance Features

- **Database Indexing**: Optimized indexes for common query patterns
- **Query Optimization**: Efficient database queries with proper joins
- **Connection Pooling**: Efficient database connection management
- **Pagination Support**: Large result set handling with limit/offset
- **Status Transitions**: Validated business logic for order status changes

## 🚀 Deployment

### Using Docker
```bash
# Build image
docker build -t order-service .

# Run container
docker run -p 3004:3004 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/order_db \
  -e JWT_SECRET=your-secret \
  order-service
```

### Using Docker Compose
```bash
# Start order service
docker-compose up order-service

# Start with build
docker-compose up --build order-service
```

## 📋 Health Monitoring

### Health Check Endpoint
```bash
curl http://localhost:3004/api/orders/health
```

Response:
```json
{
  "service": "order-service",
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Metrics & Monitoring
- **Health checks**: Built-in health check endpoint for container orchestration
- **Error tracking**: Comprehensive error logging and monitoring
- **Performance metrics**: Response time and throughput tracking
- **Database monitoring**: Connection pool and query performance metrics
- **Business metrics**: Order completion rates and average processing times

## 🤝 Integration

### With Other Services
- **Auth Service**: JWT token validation for user authentication
- **User Service**: Customer profile integration and preferences
- **Nutrition Service**: Nutritional information for ordered items
- **Payment Service**: Payment processing and transaction management
- **Notification Service**: Order status updates and customer notifications

### External APIs
- **Payment Gateways**: Integration with payment processors
- **Delivery Services**: Third-party delivery service integration
- **SMS/Email Services**: Customer notification systems
- **Analytics Platforms**: Business intelligence and reporting

## 📚 Business Logic

### Order Creation Process
1. Validate customer information and delivery details
2. Calculate subtotal from individual item prices
3. Apply tax calculation (10% default)
4. Add delivery fee based on delivery type
5. Apply discounts and coupon codes
6. Generate unique order number
7. Create order and order items in database
8. Initialize order status history
9. Return complete order information

### Status Transition Rules
- **PENDING** can transition to: CONFIRMED, CANCELLED
- **CONFIRMED** can transition to: PREPARING, CANCELLED
- **PREPARING** can transition to: READY, CANCELLED
- **READY** can transition to: OUT_FOR_DELIVERY, DELIVERED, CANCELLED
- **OUT_FOR_DELIVERY** can transition to: DELIVERED, CANCELLED
- **DELIVERED** can transition to: REFUNDED
- **CANCELLED** can transition to: REFUNDED
- **REFUNDED** is terminal state

### Financial Calculations
```typescript
// Order total calculation
const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
const taxAmount = subtotal * 0.1; // 10% tax
const deliveryFee = deliveryType === 'DELIVERY' ? 25000 : 0; // 25k VND
const totalAmount = subtotal + taxAmount + deliveryFee - discountAmount;
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL environment variable
   - Ensure PostgreSQL is running and accessible
   - Verify database exists and migrations are applied

2. **Invalid Status Transition**
   - Check current order status
   - Verify transition is allowed per business rules
   - Ensure proper authorization for status changes

3. **Order Creation Failed**
   - Validate all required fields are provided
   - Check item pricing and quantity values
   - Ensure delivery address is provided for delivery orders

4. **Authentication Errors**
   - Verify JWT_SECRET matches auth-service
   - Check token format (Bearer <token>)
   - Ensure token is not expired

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Database query debugging
DEBUG=order:database npm run dev

# Full debug logging
DEBUG=* npm run dev
```

### Performance Troubleshooting
- Monitor database query performance with EXPLAIN
- Check for proper index usage on filtered columns
- Consider pagination for large order lists
- Optimize status history queries with proper indexes

## 📈 Scaling Considerations

### Horizontal Scaling
- Stateless service design allows multiple instances
- Database connection pooling for concurrent requests
- Load balancer support with health checks
- Container orchestration with Docker/Kubernetes

### Performance Optimization
- Database read replicas for analytics queries
- Caching frequently accessed order data
- Asynchronous processing for status updates
- Event-driven architecture for real-time updates

---

Built with ❤️ for the UTH OOP Project - Complete order management solution for modern food delivery systems!