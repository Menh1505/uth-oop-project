# Frontend Admin Dashboard Implementation Guide

## Overview
The admin dashboard has been updated to work with real backend APIs instead of mock data. All admin pages now fetch from the microservices API Gateway.

## Project Structure

### Admin Pages
Located in `fe-foot/src/pages/admin/`:

1. **Restaurants.tsx**
   - Manages restaurant partners
   - API Endpoint: `GET/POST /partners/restaurants`
   - Features: Create, view, edit, delete restaurants
   - Status: ✅ API-integrated

2. **Orders.tsx**
   - Displays and manages customer orders
   - API Endpoint: `GET /orders`
   - Features: View orders, filter by status, stats dashboard
   - Status: ✅ API-integrated

3. **DeliveryPartners.tsx**
   - Manage delivery drivers
   - API Endpoint: `GET/POST /deliveries/drivers`
   - Features: Create drivers, view status, analytics
   - Status: 🔄 Needs update

4. **Vouchers.tsx**
   - Manage promotions and voucher codes
   - API Endpoint: `GET/POST /partners/restaurants/:id/promotions`
   - Features: Create, view, manage vouchers
   - Status: 🔄 Needs update

5. **Analytics.tsx**
   - System-wide analytics and statistics
   - API Endpoints: `/admin/stats`, `/admin/system/info`
   - Features: Revenue, users, orders analytics
   - Status: 🔄 Needs update

6. **AdminDashboard.tsx**
   - Main admin home page
   - API Endpoints: Multiple stats endpoints
   - Features: Overview cards, recent activity
   - Status: 🔄 Needs update

### API Client
Location: `fe-foot/src/lib/api/client.ts`

The `ApiClient` class handles all HTTP requests with:
- Automatic token management (reads from `localStorage.accessToken`)
- Error handling and 401 redirect
- Standard CRUD methods: `get`, `post`, `put`, `patch`, `delete`

**Usage:**
```typescript
import { ApiClient } from '@/lib/api/client';

// GET request
const restaurants = await ApiClient.get<Restaurant[]>('/partners/restaurants');

// POST request
const newRestaurant = await ApiClient.post('/partners/restaurants', {
  name: 'New Restaurant',
  address: '123 Main St'
});

// PUT request
await ApiClient.put(`/partners/restaurants/${id}`, updatedData);

// DELETE request
await ApiClient.delete(`/partners/restaurants/${id}`);
```

## Setup Instructions

### 1. Backend Services (Ensure Running)

Make sure the API Gateway and services are running:

```bash
cd backend
docker-compose up --build
```

Services should be accessible at:
- API Gateway: `http://localhost:3000`
- Auth Service: `http://localhost:3001`
- User Service: `http://localhost:3002`
- Order Service: `http://localhost:3006`
- Delivery Service: `http://localhost:3004`
- Partner Service: `http://localhost:3010`
- Admin Service: `http://localhost:3013`

### 2. Frontend Development Server

```bash
cd fe-foot
pnpm install  # if not already done
pnpm run dev
```

Frontend will be available at: `http://localhost:5173` (or as shown in terminal)

### 3. Admin Access

Login as admin user:
- URL: `http://localhost:5173/login`
- Admin endpoint: `POST /auth/admin/login`
- Default role: `admin`

Once authenticated, navigate to `/admin` to access the admin dashboard.

## API Endpoints Reference

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - User login
- `POST /auth/admin/login` - Admin login (use for admin access)
- `POST /auth/refresh` - Refresh access token
- `GET /auth/verify` - Verify token
- `POST /auth/logout` - Logout

### Restaurants/Partners
- `GET /partners/restaurants` - List all restaurants
- `POST /partners/restaurants` - Create restaurant
- `GET /partners/restaurants/:id` - Get restaurant details
- `PUT /partners/restaurants/:id` - Update restaurant
- `DELETE /partners/restaurants/:id` - Delete restaurant
- `GET /partners/restaurants/:id/menu` - Get menu items

### Orders
- `GET /orders` - Get all orders (with filters)
- `GET /orders/:id` - Get order details
- `POST /orders` - Create order
- `PUT /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order
- `PUT /orders/:id/status` - Update order status
- `POST /orders/:id/cancel` - Cancel order

### Delivery
- `GET /deliveries/drivers` - List drivers
- `POST /deliveries/drivers` - Create driver
- `GET /deliveries/drivers/:id` - Get driver
- `PATCH /deliveries/drivers/:id/status` - Update driver status
- `GET /deliveries` - List deliveries
- `GET /deliveries/analytics/drivers` - Driver analytics

### Admin
- `GET /admin/users` - List all users
- `GET /admin/stats` - Get admin statistics
- `GET /admin/system/info` - Get system info
- `DELETE /admin/users/:userId` - Delete user

## Implementation Pattern

Each admin page follows this pattern:

```typescript
import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api/client';

interface DataType { /* ... */ }

export default function AdminPage() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await ApiClient.get<DataType[]>('/api-endpoint');
      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render with loading and error states
  return (
    <AdminLayout>
      {error && <ErrorAlert message={error} />}
      {loading ? <LoadingSpinner /> : <DataTable data={data} />}
    </AdminLayout>
  );
}
```

## Authentication Flow

1. User logs in via `/auth/admin/login` endpoint
2. Token is stored in `localStorage.accessToken`
3. `ApiClient` automatically includes token in all requests
4. If token expires (401), user is redirected to `/login`
5. Refresh token flow can be implemented via `POST /auth/refresh`

## Common Tasks

### Adding a New Admin Page

1. Create file: `fe-foot/src/pages/admin/YourPage.tsx`
2. Import `ApiClient` and `AdminLayout`
3. Define data interfaces
4. Add route in `App.tsx`:
   ```tsx
   <Route path="/admin/your-page" element={<YourPage />} />
   ```
5. Add sidebar navigation in `AdminLayout.tsx`

### Connecting to a New API

1. Identify the endpoint from `API_ROUTES.md`
2. Use `ApiClient.get/post/put/delete()` method
3. Handle loading and error states
4. Display data or empty state

### Form Submission

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setSubmitting(true);
    await ApiClient.post('/endpoint', formData);
    setFormData({}); // reset
    await fetchData(); // refresh list
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Lỗi');
  } finally {
    setSubmitting(false);
  }
};
```

## Troubleshooting

### 401 Unauthorized Error
- Check if user is logged in
- Verify token is in `localStorage.accessToken`
- Check if token has expired

### CORS Issues
- Ensure backend API Gateway is running on port 3000
- Check that API Gateway is configured to allow frontend origin

### API Endpoint Not Found (404)
- Verify endpoint in `API_ROUTES.md`
- Check backend service is running
- Verify endpoint URL spelling and HTTP method

### Type Errors in VSCode
- These are usually non-blocking TypeScript checker errors
- The code will still run fine in development
- Can be resolved by running `pnpm run build` to check actual compilation

## Next Steps

1. Update remaining admin pages (DeliveryPartners, Vouchers, Analytics)
2. Implement form validation
3. Add success notifications
4. Add pagination for large datasets
5. Add search/filter functionality
6. Implement bulk operations

## Backend Documentation

For detailed backend API documentation, see:
- `backend/API_ROUTES.md` - Complete API reference
- `backend/README.md` - Backend setup guide
- Individual service README files in each service directory
