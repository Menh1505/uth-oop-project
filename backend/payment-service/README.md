# Payment Service

Payment Service cho hệ thống đặt món ăn với tích hợp Apple Pay, PayOS và mock gateway để testing.

## 🌟 Tính Năng

### Payment Processing
- ✅ Tạo và xử lý thanh toán với nhiều gateway
- ✅ Hỗ trợ Apple Pay với token validation
- ✅ Tích hợp PayOS cho thanh toán Việt Nam
- ✅ Mock Gateway cho testing và development
- ✅ Multi-currency support (VND, USD)
- ✅ Payment lifecycle management với 7 trạng thái

### Refund Management
- ✅ Full và partial refunds
- ✅ Refund request workflow
- ✅ Admin approval system
- ✅ Gateway-specific refund processing

### Security & Compliance
- ✅ JWT authentication và authorization
- ✅ Rate limiting cho payment endpoints
- ✅ Webhook signature verification
- ✅ PCI DSS compliant architecture
- ✅ Request/response encryption

### Analytics & Monitoring
- ✅ Payment statistics và reporting
- ✅ Transaction history tracking
- ✅ Revenue analytics
- ✅ Gateway performance monitoring

## 🏗️ Kiến Trúc

```
payment-service/
├── src/
│   ├── controllers/         # REST API controllers
│   │   └── PaymentController.ts
│   ├── services/           # Business logic
│   │   └── PaymentService.ts
│   ├── models/             # Data models
│   │   └── Payment.ts
│   ├── gateways/           # Payment gateway integrations
│   │   ├── ApplePayGateway.ts
│   │   ├── PayOSGateway.ts
│   │   └── MockGateway.ts
│   ├── config/             # Configuration
│   │   └── payment.ts
│   ├── middleware/         # Express middleware
│   │   ├── authMiddleware.ts
│   │   └── errorHandler.ts
│   ├── routes/             # API routes
│   │   └── paymentRoutes.ts
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server startup
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Cài Đặt và Chạy

### Development

```zsh
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build

# Start production server
npm start
```

### Docker

```zsh
# Build image
docker build -t payment-service .

# Run container
docker run -p 3003:3003 payment-service
```

### Docker Compose (Recommended)

```zsh
# Từ thư mục backend
docker-compose up payment-service
```

## 🔧 Cấu Hình

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/payment_db
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=payment_db
DB_PORT=5432

# JWT
JWT_SECRET=your-secret-key

# Apple Pay
APPLE_PAY_MERCHANT_ID=merchant.your.app
APPLE_PAY_PROCESSING_CERTIFICATE_PATH=/path/to/cert.p12
APPLE_PAY_PROCESSING_CERTIFICATE_PASSWORD=cert-password

# PayOS
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key
PAYOS_RETURN_URL=http://localhost:3000/success
PAYOS_CANCEL_URL=http://localhost:3000/cancel

# Mock Gateway
MOCK_GATEWAY_SUCCESS_RATE=0.9
MOCK_GATEWAY_PROCESS_TIME=2000
```

## 📋 API Endpoints

### Payment Management

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/payments` | Tạo payment mới | ✅ |
| `GET` | `/api/payments` | Lấy danh sách payments | ✅ |
| `GET` | `/api/payments/:id` | Lấy payment theo ID | ✅ |
| `PUT` | `/api/payments/:id` | Cập nhật payment | ✅ |
| `DELETE` | `/api/payments/:id` | Hủy payment | ✅ |

### Gateway-Specific Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/apple-pay` | Tạo Apple Pay payment | ✅ |
| `POST` | `/api/payos` | Tạo PayOS payment | ✅ |
| `POST` | `/api/mock` | Tạo Mock payment (testing) | ✅ |

### Refund Management

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/refunds` | Tạo refund request | ✅ |

### Webhooks

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/webhooks/apple-pay` | Apple Pay webhook | ❌ |
| `POST` | `/api/webhooks/payos` | PayOS webhook | ❌ |
| `POST` | `/api/webhooks/mock` | Mock webhook | ❌ |

### Analytics

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/api/stats` | Payment statistics | ✅ |
| `GET` | `/api/admin/payments` | Admin - All payments | 👑 |
| `GET` | `/api/admin/stats` | Admin - Global stats | 👑 |

### Health Check

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/health` | Service health check | ❌ |

## 💳 Payment Gateways

### Apple Pay Gateway
- **Tích hợp**: Apple Pay Processing API
- **Features**: Token validation, Payment processing, Refunds
- **Testing**: Apple Pay Sandbox environment

### PayOS Gateway  
- **Tích hợp**: PayOS Vietnam API
- **Features**: Bank transfer, QR code payments, Refunds
- **Testing**: PayOS Sandbox environment

### Mock Gateway
- **Mục đích**: Testing và development
- **Features**: Configurable success rate, Processing time simulation
- **Testing**: Perfect cho automated testing

## 🔒 Security Features

### Authentication & Authorization
```typescript
// JWT Token required cho tất cả protected endpoints
Authorization: Bearer <your-jwt-token>

// Admin endpoints cần role = 'admin'
{
  "userId": "user123",
  "email": "user@example.com", 
  "role": "admin"
}
```

### Rate Limiting
- **General API**: 100 requests/15 minutes per IP
- **Payment Creation**: 10 requests/5 minutes per IP
- **Webhook Processing**: Unlimited (with signature verification)

### Request Validation
- Input sanitization và validation
- Payment amount limits
- Currency format validation
- Gateway-specific data validation

## 📊 Database Schema

### Payments Table
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255),
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    -- ... more fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Payment Status Lifecycle
```
PENDING → PROCESSING → COMPLETED
    ↓         ↓           ↓
CANCELLED  FAILED    REFUNDED/PARTIALLY_REFUNDED
```

## 🧪 Testing

### Unit Tests
```zsh
npm test
```

### Integration Tests  
```zsh
npm run test:integration
```

### Mock Payment Testing
```javascript
// Tạo mock payment cho testing
POST /api/mock
{
  "amount": 100000,
  "currency": "VND",
  "customer_name": "Test User",
  "customer_email": "test@example.com",
  "description": "Test payment"
}
```

## 📈 Monitoring & Analytics

### Payment Statistics
- Total revenue by period
- Payment success rates
- Gateway performance comparison  
- Failed payment analysis
- Refund metrics

### Health Monitoring
```zsh
curl http://localhost:3003/health
```

Response:
```json
{
  "service": "payment-service",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "gateways": {
    "apple_pay": "available",
    "payos": "available", 
    "mock_gateway": "available"
  }
}
```

## 🔄 Error Handling

### Common Error Responses
```json
{
  "success": false,
  "error": "Payment not found",
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/payments/invalid-id"
}
```

### Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## 🚧 Development

### Code Structure Guidelines
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Gateways**: Handle payment provider integrations
- **Models**: Define data structures và types
- **Middleware**: Handle cross-cutting concerns

### Best Practices
- ✅ Always validate payment amounts
- ✅ Log all payment operations
- ✅ Handle gateway timeouts gracefully
- ✅ Implement idempotency for critical operations
- ✅ Use secure coding practices for financial data

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/payment-enhancement`
3. Commit changes: `git commit -am 'Add new payment feature'`
4. Push to branch: `git push origin feature/payment-enhancement`
5. Create Pull Request

## 📞 Support

Nếu có vấn đề hoặc câu hỏi:
- 📧 Email: support@uth-oop-project.com
- 🐛 Issues: GitHub Issues
- 📖 Docs: [Payment Service Documentation](./DOCS.md)

---

**Payment Service** - Secure, scalable payment processing for modern applications 💳✨