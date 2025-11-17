# FitFood Admin Dashboard - Quick Start Guide

## 🚀 Start Everything

```bash
# Terminal 1 - Backend Services
cd backend
docker-compose up --build

# Terminal 2 - Frontend Dev Server
cd fe-foot
pnpm run dev
```

**URLs:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`

---

## 🔐 Admin Login

Navigate to: `http://localhost:5173/login`

**Admin Endpoint**: `POST /auth/admin/login`
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitfood.com","password":"password"}'
```

After login, token is saved to `localStorage.accessToken`

---

## 📍 Admin Pages

| Page | URL | API Endpoint | Status |
|------|-----|--------------|--------|
| Dashboard | `/admin/dashboard` | Multiple | 🔄 Mock Data |
| Restaurants | `/admin/restaurants` | `GET /partners/restaurants` | ✅ Live |
| Orders | `/admin/orders` | `GET /orders` | ✅ Live |
| Delivery Partners | `/admin/delivery-partners` | `GET /deliveries/drivers` | ✅ Live |
| Vouchers | `/admin/vouchers` | `GET /partners/restaurants/:id/promotions` | 🔄 Mock Data |
| Analytics | `/admin/analytics` | `GET /admin/stats` | 🔄 Mock Data |

---

## 🛠️ API Client Usage

### Import
```typescript
import { ApiClient } from '@/lib/api/client';
```

### Methods
```typescript
// GET
const data = await ApiClient.get<T>('/endpoint');

// POST
const result = await ApiClient.post<T>('/endpoint', body);

// PUT
const result = await ApiClient.put<T>('/endpoint', body);

// PATCH
const result = await ApiClient.patch<T>('/endpoint', body);

// DELETE
await ApiClient.delete('/endpoint');
```

### Example
```typescript
const restaurants = await ApiClient.get<Restaurant[]>('/partners/restaurants');
```

---

## 📝 Common API Endpoints

### Restaurants
```
GET  /partners/restaurants           # List all
POST /partners/restaurants           # Create
GET  /partners/restaurants/:id       # Get one
PUT  /partners/restaurants/:id       # Update
DELETE /partners/restaurants/:id     # Delete
```

### Orders
```
GET  /orders                         # List all
GET  /orders/:id                     # Get one
POST /orders                         # Create
PUT  /orders/:id/status              # Update status
POST /orders/:id/cancel              # Cancel
```

### Delivery Drivers
```
GET  /deliveries/drivers             # List all
POST /deliveries/drivers             # Create
GET  /deliveries/drivers/:id         # Get one
PATCH /deliveries/drivers/:id/status # Update status
```

---

## 🎯 Add API Integration to a Page

### Step 1: Import
```typescript
import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api/client';
```

### Step 2: Add State
```typescript
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
```

### Step 3: Fetch Function
```typescript
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    setLoading(true);
    setError('');
    const result = await ApiClient.get<DataType[]>('/endpoint');
    setData(result || []);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error');
    console.error('Error:', err);
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Render
```tsx
{loading && <div>Loading...</div>}
{error && <div className="text-red-500">{error}</div>}
{data.length === 0 && <div>No data</div>}
{data && (
  <table>
    <tbody>
      {data.map(item => (
        <tr key={item.id}>
          <td>{item.name}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
```

---

## 🐛 Debugging

### Check Token
```javascript
console.log(localStorage.getItem('accessToken'));
```

### Check API Response
Open DevTools → Network tab → Click API request → Response tab

### Backend Logs
```bash
docker-compose logs -f [service-name]
# Examples:
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
docker-compose logs -f user-service
```

### Frontend Logs
Check browser DevTools Console (F12)

---

## ✨ Features Implemented

### ✅ Fully Integrated
- Restaurants Page - CRUD with API
- Orders Page - List with stats and filtering
- Delivery Partners Page - List with status management

### 🔄 Need Integration
- Vouchers Page - Currently mock data
- Analytics Page - Currently mock data
- AdminDashboard Page - Currently mock data

---

## 📚 Full Documentation

See detailed docs:
- `ADMIN_IMPLEMENTATION_COMPLETE.md` - Complete implementation status
- `fe-foot/ADMIN_SETUP.md` - Detailed admin setup guide
- `backend/API_ROUTES.md` - Complete API reference

---

## 🔑 Key Files

```
fe-foot/
├── src/
│   ├── lib/api/
│   │   └── client.ts              # API client utility
│   ├── pages/admin/
│   │   ├── AdminDashboard.tsx     # Main admin dashboard
│   │   ├── Restaurants.tsx        # ✅ API-integrated
│   │   ├── Orders.tsx             # ✅ API-integrated
│   │   ├── DeliveryPartners.tsx   # ✅ API-integrated
│   │   ├── Vouchers.tsx           # 🔄 Mock data
│   │   └── Analytics.tsx          # 🔄 Mock data
│   ├── components/layout/
│   │   └── AdminLayout.tsx        # Sidebar navigation
│   └── App.tsx                    # Routes configuration
├── ADMIN_SETUP.md                 # Admin setup guide
└── README.md

backend/
├── API_ROUTES.md                  # API reference (NEW)
└── docker-compose.yml             # Services configuration
```

---

## 💡 Tips

1. **Hot Reload**: Frontend auto-reloads on file changes
2. **Token Auto-Management**: ApiClient handles auth automatically
3. **Error States**: All pages have error and loading states
4. **Consistent UI**: Use `AdminLayout` wrapper for all pages
5. **TypeScript**: Use interfaces for type safety

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Re-login, check localStorage.accessToken |
| API Gateway not found | Ensure `docker-compose up` completed |
| CORS error | Check API Gateway CORS config |
| Port already in use | Kill process: `lsof -i :PORT` then `kill -9 PID` |
| Cannot import module | Run `pnpm install` in fe-foot directory |

---

## 🚢 Deployment Checklist

- [ ] All 6 admin pages have API integration
- [ ] Form validation implemented
- [ ] Success notifications added
- [ ] Error handling tested
- [ ] Loading states working
- [ ] Empty states handled
- [ ] Pagination added (for large datasets)
- [ ] Search/filter working
- [ ] Role-based access verified
- [ ] Audit logging implemented

---

**Ready to develop!** 🎉

Questions? Check the documentation files or look at existing implemented pages for patterns.
