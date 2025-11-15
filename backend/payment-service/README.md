# Payment Service

The Payment Service manages premium subscriptions and payment processing for the FitFood application. It controls access to premium features like AI-powered recommendations.

## Features

- **Subscription Management**: Handle premium subscription plans (basic/premium)
- **Payment Processing**: Process payments for subscriptions using PayOS integration
- **Access Control**: Verify premium subscription status for other services
- **Payment History**: Track user payment history and subscription status
- **Subscription Lifecycle**: Manage subscription activation, renewal, and cancellation

## API Endpoints

### Public Endpoints

#### Get Subscription Plans
```http
GET /api/payments/plans
```

Returns available subscription plans.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "basic",
      "price": 0,
      "duration_days": 30,
      "features": ["Basic meal tracking", "Exercise logging"],
      "is_active": true
    },
    {
      "id": 2,
      "type": "premium",
      "price": 199000,
      "duration_days": 30,
      "features": ["All basic features", "AI recommendations", "Advanced analytics"],
      "is_active": true
    }
  ]
}
```

### Protected Endpoints (Require Authentication)

#### Check User Subscription Status
```http
GET /api/payments/user/:userId/subscription
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_premium": true,
    "subscription": {
      "id": 123,
      "user_id": 1,
      "subscription_id": 2,
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-01-31T23:59:59.999Z",
      "is_active": true,
      "auto_renew": true
    },
    "remaining_days": 25
  }
}
```

#### Create Payment for Subscription
```http
POST /api/payments/user/:userId/payment
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 199000,
  "currency": "VND",
  "subscription_id": 2,
  "payment_method": "payos"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "user_id": 1,
    "amount": 199000,
    "currency": "VND",
    "status": "completed",
    "payment_method": "payos",
    "transaction_id": "tx_1704067200000",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Payment processed successfully"
}
```

#### Get Payment History
```http
GET /api/payments/user/:userId/payments
Authorization: Bearer <jwt_token>
```

#### Cancel Subscription
```http
DELETE /api/payments/user/:userId/subscription
Authorization: Bearer <jwt_token>
```

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password123
DB_NAME=fitfood_db
DB_PORT=5432

# JWT
JWT_SECRET=your-secret-key

# PayOS Integration (Add your credentials)
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# Service Configuration
PORT=3008
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Payment Service URL (for other services to check subscription)
PAYMENT_SERVICE_URL=http://payment-service:3008
```

## Database Tables

The service uses the following database tables:

### subscriptions
- `id`: Subscription plan ID
- `type`: 'basic' or 'premium'
- `price`: Price in VND
- `duration_days`: Subscription duration
- `features`: JSON array of features
- `is_active`: Whether the plan is available

### payments
- `id`: Payment record ID
- `user_id`: Reference to user
- `amount`: Payment amount
- `currency`: Payment currency
- `status`: 'pending', 'completed', 'failed', 'cancelled'
- `payment_method`: Payment method used
- `transaction_id`: Gateway transaction ID
- `gateway_response`: Gateway response data

### user_subscriptions
- `id`: User subscription ID
- `user_id`: Reference to user
- `subscription_id`: Reference to subscription plan
- `payment_id`: Reference to payment
- `start_date`: Subscription start date
- `end_date`: Subscription end date
- `is_active`: Whether subscription is active
- `auto_renew`: Whether to auto-renew

## Premium Access Control

Other services can check premium subscription status by making requests to:

```http
GET /api/payments/user/:userId/subscription
```

The recommendation service uses this endpoint to verify premium access before providing AI recommendations.

## Integration with Recommendation Service

The recommendation service includes middleware that:
1. Authenticates the user with JWT
2. Checks premium subscription status via Payment Service
3. Allows/denies access to AI recommendations based on subscription

If the payment service is unavailable, the system can be configured to:
- **Fail Open**: Allow access (set `SUBSCRIPTION_CHECK_FAIL_OPEN=true`)
- **Fail Closed**: Deny access (default behavior)

## PayOS Integration

The service is configured for PayOS payment gateway integration. To enable:

1. Sign up for PayOS account
2. Get your credentials (Client ID, API Key, Checksum Key)
3. Add credentials to environment variables
4. Implement webhook handling for payment notifications

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Testing

```bash
# Run the test script
./test.sh

# Test health endpoint
curl http://localhost:3008/health

# Test subscription plans
curl http://localhost:3008/api/payments/plans
```

## Docker Deployment

The service includes a Dockerfile for containerized deployment:

```bash
# Build image
docker build -t payment-service .

# Run container
docker run -p 3008:3008 payment-service
```

The service is included in the main `docker-compose.yml` and will be available at `http://localhost:3018:3008` externally.

## Error Handling

The service includes comprehensive error handling for:
- Database connection issues
- Payment gateway failures  
- Invalid subscription plans
- Authentication/authorization errors
- Validation errors for payment requests

All errors are logged using Winston logger and return structured JSON responses.