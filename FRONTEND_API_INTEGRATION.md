# Frontend API Integration Update

**Last Updated**: 2025-11-16  
**Status**: ✅ Complete - All 7 user-facing pages now integrated with backend APIs

## Overview

All frontend pages have been updated to fetch real data from backend APIs instead of using mock data and local Zustand state. Pages now support:
- Real API calls with error handling
- Loading states with spinners
- Fallback to mock/local data when APIs unavailable
- Token-based authentication (auto-managed by ApiClient)

## Updated Pages

### 1. **journal/Meals.tsx** ✅
**Purpose**: Log meals with nutrition tracking  
**API Endpoints Used**:
- `GET /nutrition/meal-logs` - Fetch user's meal history
- `POST /nutrition/meal-logs` - Create new meal log
- `GET /foods/barcode/:barcode` - Lookup food by barcode (future)

**Changes**:
- Form state remains local (name, calories, macros)
- Meal list now fetches from backend via `ApiClient.get()`
- Add meal triggers `POST /nutrition/meal-logs` before adding to Zustand
- Error handling for failed API calls
- Loading spinner during fetch
- Barcode scanning placeholder

**Note**: Barcode scanning UI is prepared but endpoint not yet implemented in backend

---

### 2. **journal/Workouts.tsx** ✅
**Purpose**: Log exercise/workouts with calorie tracking  
**API Endpoints Used**:
- `GET /workouts/logs` - Fetch user's workout history
- `POST /workouts/logs` - Create new workout log
- `GET /workouts/plans` - Get workout plans (optional future)

**Changes**:
- Form state remains local (name, calories burned, duration)
- Workout list fetches from `GET /workouts/logs`
- Add workout triggers `POST /workouts/logs`
- Error handling and loading states
- Fallback to empty list if API fails

---

### 3. **Menu.tsx** ✅
**Purpose**: Browse menu items from restaurants and manage shopping cart  
**API Endpoints Used**:
- `GET /catalog/products` - Fetch all available menu items
- `POST /orders` - Create order from cart (in Checkout page)

**Changes**:
- Replaced hardcoded MENU constant with API fetch
- Items now load from `/catalog/products`
- Cart management remains in Zustand (local state)
- Loading spinner during menu fetch
- Error display with retry capability

---

### 4. **Order.tsx** ✅
**Purpose**: View and manage user's orders  
**API Endpoints Used**:
- `GET /orders` - Fetch user's order list
- `GET /orders/:id` - Fetch single order details
- `POST /orders/:id/cancel` - Cancel an order

**Changes**:
- Now fetches multiple orders from backend
- Dropdown selector to switch between orders (if multiple exist)
- Shows order items detail and status progression
- Cancel button triggers `POST /orders/:id/cancel`
- Fallback message if no orders exist
- Error handling for API failures

**Improvements over mock**:
- Real order history instead of single hardcoded order
- Live status updates from backend
- Order item details displayed

---

### 5. **Checkout.tsx** ✅
**Purpose**: Review cart and process payment  
**API Endpoints Used**:
- `POST /orders` - Create new order

**Changes**:
- Replaced mock payment buttons with real order creation
- All three payment methods (standard, PayOS, Apple Pay) create actual orders
- Order data structured to match backend schema:
  ```typescript
  {
    items: [{ itemId, qty, price }],
    total: number,
    paymentMethod: "standard" | "payos" | "apple"
  }
  ```
- Success → clears cart → navigates to order tracking
- Error handling with retry
- Loading state during order creation
- Apple Pay availability detection still works

---

### 6. **Analytics.tsx** ✅
**Purpose**: 7-day nutrition summary with daily breakdown  
**API Endpoints Used**:
- `GET /nutrition/analysis/daily` - Fetch daily nutrition analysis

**Changes**:
- Attempts to fetch real analytics from `/nutrition/analysis/daily`
- Falls back to local calculation if API unavailable
- Local calculation uses Zustand meals/workouts state
- Table shows: Date, Calories In, Calories Out, Macros, Balance
- Error display as warning (not critical)
- Loading spinner during fetch

**Smart Fallback**: If backend is down, still works with local data

---

### 7. **Ai.tsx** ✅
**Purpose**: AI-powered meal and workout suggestions  
**API Endpoints Used**:
- `GET /recommendations/users/:userId/recommendations` - Fetch personalized recommendations

**Changes**:
- Fetches recommendations from backend recommendation service
- Falls back to mock suggestions based on user profile
- Displays meal suggestion:
  - Title, calories, macros
  - "Add to Journal" button triggers `addMeal()`
- Displays workout suggestion:
  - Title, calorie burn, duration
  - "Add to Journal" button triggers `addWorkout()`
- Error handling with fallback to mock
- Loading state during fetch

**Smart Fallback**: Mock suggestions use same logic as before if API unavailable

---

## API Client Integration

All pages use the centralized `ApiClient` utility at `fe-foot/src/lib/api/client.ts`:

```typescript
// GET requests
const data = await ApiClient.get<T>('/endpoint');

// POST requests
const result = await ApiClient.post<T>('/endpoint', payload);

// PUT requests
const result = await ApiClient.put<T>('/endpoint/:id', payload);

// DELETE requests
await ApiClient.delete('/endpoint/:id');
```

**Features**:
- Auto-adds Authorization header with JWT token from localStorage
- Auto-prefixes with API gateway URL (http://localhost:3000)
- Error handling with descriptive messages
- Generic type support for TypeScript

---

## State Management

### Zustand Store (Local)
Still used for:
- User profile
- Shopping cart (menu items + quantities)
- Current user session
- Quick actions (addMeal, addWorkout, etc.)

### Backend APIs (Remote)
Now fetch:
- Meal logs history
- Workout logs history
- Menu items catalog
- Order list and details
- Recommendations
- Analytics data

**Pattern**: Form inputs use local state → API call on submit → Zustand store updated → Backend persisted

---

## Error Handling Strategy

Each page implements 3-tier error handling:

1. **API Available** → Show real data from backend
2. **API Down** → Show cached/local data (fallback)
3. **No Local Data** → Show "No data" message with user message

```typescript
try {
  const data = await ApiClient.get('/endpoint');
  setData(data);
} catch (err) {
  setError(err.message);
  // Optionally: useLocalData() or useMockData()
} finally {
  setLoading(false);
}
```

---

## Testing Checklist

Before deploying, verify:

- [ ] Dev server running on http://localhost:5173
- [ ] Backend docker services running (docker-compose up)
- [ ] Valid JWT token in localStorage.accessToken
- [ ] Each page's API calls appear in browser Network tab
- [ ] Error messages display properly when API is down
- [ ] Forms submit successfully to backend
- [ ] Orders created successfully in Order.tsx
- [ ] Analytics loads or falls back gracefully
- [ ] Recommendations loaded or mock suggestions shown

---

## TypeScript Config Update

Updated `tsconfig.app.json` to include:
```json
"types": ["vite/client", "react", "react-dom"]
```

This fixes JSX IntrinsicElements errors in development.

---

## Next Steps (Future Enhancement)

1. **Barcode Scanning** - Implement real barcode lookup via `/foods/barcode/:barcode`
2. **Real Payment** - Integrate PayOS SDK for actual payment processing
3. **User Auth** - Add proper login flow to get valid JWT tokens
4. **Real-time Updates** - Add WebSocket for live order status
5. **Caching** - Add React Query or SWR for better data fetching
6. **Offline Mode** - Service worker for offline access to cached data
7. **Charts** - Add Recharts for analytics visualization

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│             Frontend (React + Vite)                 │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Meals.tsx → GET /nutrition/meal-logs               │
│  Workouts.tsx → GET /workouts/logs                  │
│  Menu.tsx → GET /catalog/products                   │
│  Order.tsx → GET /orders, POST /orders/:id/cancel  │
│  Checkout.tsx → POST /orders                        │
│  Analytics.tsx → GET /nutrition/analysis/daily      │
│  Ai.tsx → GET /recommendations/users/:userId       │
│                                                       │
│         ↓ (via ApiClient with auth)                 │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │    API Gateway (localhost:3000)              │   │
│  └──────────────────────────────────────────────┘   │
│         ↓ (routes to services)                      │
│                                                       │
└─────────────────────────────────────────────────────┘

Backend Microservices (Docker):
  - Nutrition Service (3004) → /nutrition/*
  - Order Service (3007) → /orders/*
  - Meal Service (3006) → /meals/*
  - Recommendation Service (3014) → /recommendations/*
  - Catalog Service → /catalog/*
```

---

## Configuration

**Dev Environment**:
- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000
- Token stored in: localStorage.accessToken

**Production Ready**:
- Update API_BASE_URL in ApiClient to production gateway URL
- Ensure CORS properly configured on backend
- Test with production JWT tokens

---

## Files Modified

```
fe-foot/
├── src/
│   ├── pages/
│   │   ├── journal/
│   │   │   ├── Meals.tsx (✅ Updated)
│   │   │   └── Workouts.tsx (✅ Updated)
│   │   ├── Menu.tsx (✅ Updated)
│   │   ├── Order.tsx (✅ Updated)
│   │   ├── Checkout.tsx (✅ Updated)
│   │   ├── Analytics.tsx (✅ Updated)
│   │   └── Ai.tsx (✅ Updated)
│   └── lib/
│       └── api/
│           └── client.ts (✅ Existing)
├── tsconfig.app.json (✅ Updated - added @types/react)
└── pnpm-lock.yaml (✅ Updated - @types/react installed)
```

---

**Summary**: 
✅ 7 user-facing pages converted from mock to real API  
✅ Error handling and loading states  
✅ Smart fallbacks to local data  
✅ TypeScript types fixed  
✅ Dev server running  
✅ Ready for integration testing
