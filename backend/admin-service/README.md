# Admin Service

Admin service for system management and administrative operations.

## Features

- System information monitoring
- Service health checks
- User management (via user-service API calls)
- Admin statistics
- JWT-based authentication with admin role authorization

## API Endpoints

### System Management
- `GET /api/admin/system/info` - Get system information
- `GET /api/admin/system/health` - Check all service health

### User Management
- `GET /api/admin/users` - Get all users (admin view)
- `DELETE /api/admin/users/:userId` - Delete user by ID

### Statistics
- `GET /api/admin/stats` - Get admin statistics

## Authentication

All endpoints require:
- JWT token in Authorization header
- User must have `role: 'admin'` in JWT payload

## Environment Variables

- `JWT_SECRET` - JWT secret key
- `PORT` - Service port (default: 3003)
- `USER_SERVICE_URL` - User service URL (default: http://localhost:3002)
- `AUTH_SERVICE_URL` - Auth service URL (default: http://localhost:3001)

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```
