# Comprehensive Microservices Test Suite

This directory contains comprehensive test files for all microservices, testing all routes, database operations, and cross-service integrations.

## Overview

Each service has its own test file (`test.sh`) that:
- Tests all API routes/endpoints
- Validates authentication and authorization
- Verifies database operations (CREATE, READ, UPDATE, DELETE)
- Checks cross-service database table entries
- Tests error handling and edge cases
- Validates data integrity across services

## Services and Their Tests

### 1. **auth-service** (`auth-service/test.sh`)
- **Port**: 3001 (exposed: 3011)
- **Database**: `auth_db`
- **Tests**:
  - User registration
  - Login (with session/refresh token)
  - Token verification and refresh
  - Session management
  - Logout and blacklist
  - Admin login and operations
  - Token blacklist management

**Database Tables**: sessions, blacklist, admin_users

### 2. **user-service** (`user-service/test.sh`)
- **Port**: 3002 (exposed: 3012)
- **Database**: `user_db`
- **Tests**:
  - Get user profile (requires auth)
  - Update user profile
  - Avatar upload endpoint
  - List all users (admin)
  - User roles and permissions

**Database Tables**: users, profiles, user_roles

### 3. **admin-service** (`admin-service/test.sh`)
- **Port**: 3003 (exposed: 3013)
- **Database**: `admin_db`
- **Tests**:
  - System info retrieval
  - System health check
  - Get all users
  - Delete user
  - Admin statistics

**Database Tables**: system_info, audit_logs

### 4. **workout-service** (`workout-service/test.sh`)
- **Port**: 3004 (exposed: 3015)
- **Database**: `workout_db`
- **Tests**:
  - Workout plans (CRUD)
  - Exercises (CRUD)
  - Workout logs (CRUD)
  - User statistics
  - Test data cleanup

**Database Tables**: workout_plans, exercises, workout_logs, user_stats

### 5. **nutrition-service** (`nutrition-service/test.sh`)
- **Port**: 3003 (exposed: 3016)
- **Database**: `nutrition_db`
- **Tests**:
  - Foods (CRUD)
  - Meal logs (CRUD)
  - Nutrition goals (get/set)
  - Daily nutrition analysis
  - Weekly nutrition analysis

**Database Tables**: foods, meal_logs, nutrition_goals, daily_nutrition, weekly_nutrition

### 6. **order-service** (`order-service/test.sh`)
- **Port**: 3004 (exposed: 3017)
- **Database**: `order_db`
- **Tests**:
  - Create orders
  - Get user orders
  - Update order details
  - Order status management (confirmed, ready, delivered)
  - Order status history
  - Order cancellation
  - Order analytics
  - Admin endpoints

**Database Tables**: orders, order_items, order_status_history

### 7. **payment-service** (`payment-service/test.sh`)
- **Port**: 3003 (exposed: 3018)
- **Database**: `payment_db`
- **Tests**:
  - Create payments (mock, PayOS, Apple Pay)
  - Get/update payments
  - Refund creation
  - Payment statistics
  - Webhook handling (mock)
  - Admin payment management

**Database Tables**: payments, refunds, payment_transactions, payment_status_history

### 8. **partner-service** (`partner-service/test.sh`)
- **Port**: 3004 (exposed: 3019)
- **Database**: `partner_db`
- **Tests**:
  - Partner management (CRUD)
  - Restaurants (CRUD)
  - Menu items (CRUD)
  - Promotions (CRUD)
  - Restaurant inventory
  - Public search endpoints

**Database Tables**: partners, restaurants, menu_items, promotions, inventory

### 9. **delivery-service** (`delivery-service/test.sh`)
- **Port**: 3004 (exposed: 3020)
- **Database**: `delivery_db`
- **Tests**:
  - Driver management (CRUD)
  - Driver location updates
  - Delivery creation
  - Delivery assignment
  - Tracking events
  - Delivery analytics
  - Driver analytics

**Database Tables**: drivers, deliveries, tracking_events, delivery_assignments

### 10. **notification-service** (`notification-service/test.sh`)
- **Port**: 3010 (exposed: 3021)
- **Database**: `notification_db`
- **Tests**:
  - Notification creation
  - Notification list/get/update/delete
  - Send/retry notifications
  - System event handling (order_placed, payment_completed, delivery_completed, etc.)
  - Multiple notification channels

**Database Tables**: notifications, notification_logs, notification_channels

### 11. **recommendation-service** (`recommendation-service/test.sh`)
- **Port**: 3011 (exposed: 3022)
- **Database**: `recommendation_db`
- **Tests**:
  - User management (CRUD)
  - User behavior tracking
  - Recommendation generation
  - Get specific recommendations (exercises, foods, quick)
  - Update recommendation status
  - AI-based suggestions

**Database Tables**: users, user_behaviors, recommendations, recommendation_feedback

### 12. **catalog-service** (`catalog-service/test.sh`)
- **Port**: 3003
- **Database**: N/A (uses read-only catalog)
- **Tests**:
  - Product retrieval (public)
  - Category retrieval (public)
  - Product creation (admin)
  - Category creation (admin)
  - Inventory management
  - Product updates
  - Admin operations

**Database Tables**: products, categories, inventory

## Running Tests

### Run Individual Service Test
```bash
cd /home/mortal/do-an-xdpm/backend
bash auth-service/test.sh
bash user-service/test.sh
bash order-service/test.sh
# ... etc
```

### Run All Services Tests
```bash
cd /home/mortal/do-an-xdpm/backend
bash run-all-tests.sh
```

### Run with Custom Host/Port
```bash
HOST=192.168.1.100 PORT=3000 bash auth-service/test.sh
```

## Test Features

### Authentication Testing
- Tests with and without auth tokens
- Validates 401 Unauthorized responses
- Tests role-based access control
- Verifies token expiration handling

### Database Verification
- Creates test data in databases
- Verifies CRUD operations
- Checks foreign key relationships
- Tests data consistency across services
- Validates cleanup operations

### Cross-Service Integration
- Order Service → Payment Service (payment_id references)
- Order Service → Delivery Service (delivery tracking)
- Notification Service → User Service (user notifications)
- Recommendation Service → Workout/Nutrition Services (behavioral data)

### Error Handling
- Tests invalid tokens (expect 401)
- Tests missing authentication (expect 401)
- Tests invalid data (expect 400)
- Tests not found scenarios (expect 404)

## Prerequisites

### Required
- Docker and Docker Compose running (`docker compose up -d`)
- All services must be deployed
- PostgreSQL databases initialized
- RabbitMQ running for async messaging
- Nginx gateway running on port 3000

### Optional
- `jq` for pretty-printing JSON output
  ```bash
  sudo apt install jq -y
  ```

## Expected Results

Each test file outputs:
- Step-by-step API call descriptions
- Raw JSON responses (or pretty-printed with jq)
- Database operation confirmations
- HTTP status codes
- Error messages (if any)

### Success Criteria
- HTTP 200/201 responses for successful operations
- HTTP 401 for unauthorized access
- HTTP 404 for not found resources
- Data persists in databases
- Cross-service references are valid

## Database Schema Verification

Each test verifies that the service's database tables exist and contain:

**Auth Service**:
- sessions (user_id, refresh_token, created_at, expires_at)
- blacklist (access_token, created_at, expires_at)

**User Service**:
- users (id, email, username, password_hash, created_at)
- profiles (user_id, full_name, avatar_url, phone, bio)

**Order Service**:
- orders (id, user_id, restaurant_id, status, total_amount, created_at)
- order_items (id, order_id, menu_item_id, quantity)
- order_status_history (id, order_id, status, changed_at)

**Payment Service**:
- payments (id, order_id, amount, status, payment_method, created_at)
- refunds (id, payment_id, amount, reason, created_at)

**Delivery Service**:
- drivers (id, full_name, phone, vehicle_type, status, created_at)
- deliveries (id, order_id, driver_id, status, created_at)
- tracking_events (id, delivery_id, event_type, created_at)

**And so on for other services...**

## Troubleshooting

### "NGINX not returning 200"
- Check if services are running: `docker compose ps`
- Verify nginx.conf has correct routes
- Test direct service connection: `curl http://localhost:3011/health`

### "Connection refused"
- Ensure Docker containers are running
- Check port mappings: `docker compose ps`
- Verify firewall allows connections

### "Unauthorized (401)"
- Auth token may be invalid or expired
- Verify auth-service is running
- Check token format in Authorization header

### "Database error"
- Check PostgreSQL is running: `docker compose logs postgres`
- Verify migrations ran successfully
- Check database credentials in service config

## Notes

- Tests create actual data in databases for verification
- Cleanup operations (DELETE) are included at the end of each test
- Tests are idempotent - can be run multiple times safely
- Cross-service data dependencies are respected in test ordering

## API Gateway Integration

All tests use Nginx gateway on `http://localhost:3000/api/<service>` when available, with fallback to direct service ports.

**Service Routes Through Gateway**:
- `/api/auth` → auth-service (port 3001)
- `/api/users` → user-service (port 3002)
- `/api/admin` → admin-service (port 3003)
- `/api/workouts` → workout-service (port 3004)
- `/api/nutrition` → nutrition-service (port 3003)
- `/api/orders` → order-service (port 3004)
- `/api/payments` → payment-service (port 3003)
- `/api/partners` → partner-service (port 3004)
- `/api/deliveries` → delivery-service (port 3004)
- `/api/notifications` → notification-service (port 3010)
- `/api/recommendations` → recommendation-service (port 3011)
- `/api/catalog` → catalog-service (port 3003)

