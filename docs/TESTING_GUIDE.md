# Frontend API Integration - Testing Guide

## Prerequisites

Before testing, ensure:

1. **Backend running**: `cd backend && docker-compose up -d`
2. **Frontend running**: `cd fe-foot && pnpm run dev` (running on localhost:5173)
3. **Valid JWT token**: Check localStorage has `accessToken`

---

## Step-by-Step Testing

### Step 1: Start Backend Services

```bash
cd ~/du-an/backend
docker-compose up -d

# Verify services are running
docker ps | grep du-an
```

Expected output:
```
- api-gateway:3000
- meal-service:3006
- order-service:3007
- nutrition-service:3004
- recommendation-service:3014
- (+ 8 other services)
```

### Step 2: Verify Frontend is Running

```bash
# In another terminal
cd ~/du-an/fe-foot
pnpm run dev
```

Visit http://localhost:5173 in browser

### Step 3: Get Authentication Token

**Option A: Use Mock Token** (for development)

Open browser DevTools Console and run:
```javascript
localStorage.setItem('accessToken', 'mock-jwt-token-for-dev');
```

**Option B: Real Login**
1. Go to http://localhost:5173/auth/login
2. Enter test credentials (if available from backend seed data)
3. Token auto-saved to localStorage

---

## Page-by-Page Testing

### Test 1: Meals Page
**URL**: http://localhost:5173/meals

**Steps**:
1. Page loads → should show "Đang tải..." spinner briefly
2. If backend working → list of previous meals appears
3. If backend down → "Lỗi tải dữ liệu" message + meal form still works
4. Enter meal details:
   - Name: "Test Meal"
   - Calories: 400
   - Protein: 20g
   - Carbs: 50g
   - Fat: 10g
5. Click "Thêm bữa ăn"
   - Should call `POST /nutrition/meal-logs`
   - Meal appears in list immediately
   - Form resets

**Expected Network Calls**:
```
GET http://localhost:3000/nutrition/meal-logs
POST http://localhost:3000/nutrition/meal-logs
```

**Success Indicators**:
- ✅ Meal list loads from API
- ✅ New meal posted successfully
- ✅ Form clears after submit
- ✅ Error displays if API fails

---

### Test 2: Workouts Page
**URL**: http://localhost:5173/workouts

**Steps**:
1. Page loads → shows spinner
2. Workout list appears (from API or empty)
3. Enter workout:
   - Name: "Test Run"
   - Calories: 300
   - Duration: 30 min
4. Click "Thêm buổi tập"
   - Calls `POST /workouts/logs`
   - Added to list

**Expected Network Calls**:
```
GET http://localhost:3000/workouts/logs
POST http://localhost:3000/workouts/logs
```

**Success Indicators**:
- ✅ Loads existing workouts
- ✅ Can add new workout
- ✅ List updates in real-time

---

### Test 3: Menu Page
**URL**: http://localhost:5173/menu

**Steps**:
1. Page loads → menu items from `GET /catalog/products`
2. Browse items (name, price, calories, macros)
3. Click "Thêm" on several items
   - Items added to cart (right panel)
   - Quantity can be adjusted
   - Total price updates
4. Click "Thanh toán"
   - Goes to Checkout page

**Expected Network Calls**:
```
GET http://localhost:3000/catalog/products
```

**Success Indicators**:
- ✅ Menu loads from `/catalog/products`
- ✅ Items show correct info
- ✅ Cart updates locally
- ✅ Can proceed to checkout

**Troubleshooting**:
- If no items: Check `/catalog/products` endpoint exists in backend
- If wrong data: Verify catalog service schema

---

### Test 4: Checkout Page
**URL**: http://localhost:5173/checkout

**Prerequisites**: Cart must have items (add from Menu page)

**Steps**:
1. Page shows:
   - Cart items listed
   - Total price
   - Three payment buttons
2. Click "Thanh toán" button:
   - Creates order via `POST /orders`
   - Order includes items, total, paymentMethod: "standard"
   - Clears cart
   - Redirects to /order page
3. Try "PayOS" button:
   - Same flow with paymentMethod: "payos"
4. Try "Apple Pay" (if on iOS):
   - Same flow with paymentMethod: "apple"
   - Shows disabled on non-iOS

**Expected Network Calls**:
```
POST http://localhost:3000/orders
(body): { items: [...], total: 50000, paymentMethod: "standard" }
GET http://localhost:3000/orders  (on redirect to Order page)
```

**Success Indicators**:
- ✅ Order created successfully
- ✅ Cart cleared after checkout
- ✅ Redirects to Order page with new order
- ✅ Error message if order creation fails

---

### Test 5: Order Page
**URL**: http://localhost:5173/order

**Prerequisites**: At least one order exists (create from Checkout)

**Steps**:
1. Page loads → fetches orders via `GET /orders`
2. Shows order list in dropdown (if multiple orders)
3. Displays selected order:
   - Order ID, timestamp, total
   - Status progression with Steps component
   - Order items detail
4. If order cancellable (status: pending/confirmed/preparing):
   - "Hủy đơn" button appears
   - Click → calls `POST /orders/:id/cancel`
   - Status updates to "cancelled"
5. If order completed:
   - Shows "✅ Hoàn tất!" message

**Expected Network Calls**:
```
GET http://localhost:3000/orders
POST http://localhost:3000/orders/:id/cancel  (if cancel clicked)
```

**Success Indicators**:
- ✅ Loads order list from API
- ✅ Shows order details correctly
- ✅ Can cancel pending orders
- ✅ Status progression visual correct
- ✅ Shows items breakdown

---

### Test 6: Analytics Page
**URL**: http://localhost:5173/analytics

**Steps**:
1. Page loads → tries to fetch from `GET /nutrition/analysis/daily`
2. **If API works**:
   - Shows 7-day table with data from backend
   - Columns: Date, Kcal in, Kcal out, Macros, Balance
3. **If API fails**:
   - Shows yellow warning: "Lỗi tải dữ liệu (Sử dụng dữ liệu local)"
   - Falls back to local calculation
   - Uses meals/workouts from Zustand
   - Still shows table correctly

**Expected Network Calls**:
```
GET http://localhost:3000/nutrition/analysis/daily
```

**Success Indicators**:
- ✅ Loads API data if available
- ✅ Graceful fallback if API down
- ✅ Table displays correctly either way
- ✅ Shows last 7 days
- ✅ Calorie balance calculated correctly

---

### Test 7: AI Suggestions Page
**URL**: http://localhost:5173/ai

**Prerequisites**: User profile must be set (from onboarding)

**Steps**:
1. Page loads → fetches from `GET /recommendations/users/:userId/recommendations`
2. **If recommendations available**:
   - Shows meal suggestion (name, calories, macros)
   - Shows workout suggestion (name, calorie burn)
   - Can click "Thêm vào Journal" for each
3. **If API fails**:
   - Falls back to mock suggestions
   - Based on user profile (goal, diet, budget)
   - Still shows suggestions
4. Add meal/workout to journal
   - Calls addMeal() or addWorkout()
   - Navigates to Journal page

**Expected Network Calls**:
```
GET http://localhost:3000/recommendations/users/current/recommendations
(or GET http://localhost:3000/recommendations/users/{userId}/recommendations)
```

**Success Indicators**:
- ✅ Loads recommendations from API
- ✅ Falls back to mock if needed
- ✅ Both meal and workout suggestions available
- ✅ "Add to Journal" works

---

## Debugging & Troubleshooting

### Issue: "Cannot find module 'react'" TypeScript errors

**Solution**:
```bash
cd fe-foot
rm -rf node_modules/.vite
pnpm install
# Restart VS Code TypeScript server
```

### Issue: API calls failing with 404

**Check**:
1. Is backend running? `docker ps`
2. Is API Gateway running on port 3000? `lsof -i :3000`
3. Is the endpoint correct in API_ROUTES.md?
4. Does the service for that endpoint exist?

**Example**: `/nutrition/meal-logs` needs nutrition-service running

### Issue: 401 Unauthorized errors

**Check**:
1. Is token in localStorage? 
   ```javascript
   console.log(localStorage.getItem('accessToken'))
   ```
2. Is token valid?
   - Use mock token for dev: `mock-jwt-token-for-dev`
   - Or login properly to get real token

### Issue: CORS errors

**Check**:
1. Backend API Gateway CORS config
2. Browser console for actual error message
3. Network tab to see preflight (OPTIONS) response

### Issue: Page shows "Chưa có dữ liệu" but API should have data

**Check**:
1. Open Network tab in DevTools
2. Verify API call was made
3. Check response body - is it empty array `[]`?
4. Check if that endpoint returns data in that format

---

## Browser DevTools Tips

### Check API Requests

1. Open DevTools → Network tab
2. Set filter to XHR/Fetch
3. Perform action on page
4. Look for requests to `localhost:3000`
5. Click request → Preview/Response tab to see data

### Check Local Storage

1. Open DevTools → Application/Storage tab
2. Select localStorage
3. Look for `accessToken` key
4. Verify it's not empty

### Check Console Errors

1. Open DevTools → Console tab
2. Look for red error messages
3. ApiClient errors often logged with `console.error()`

---

## Performance Testing

### Slow Network Simulation

Browser DevTools → Network → Throttling (e.g., "Slow 3G")

**Expected behavior**:
- Loading spinners should appear
- Forms should be disabled during loading
- "Đang tải..." message visible

### Offline Testing

Browser DevTools → Network → Offline

**Expected behavior**:
- Error messages appear
- Fallback data shown (if implemented)
- Forms may not work until back online

---

## Load Testing Data

### Create Test Orders

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-jwt-token-for-dev" \
  -d '{
    "items": [
      {"itemId": "1", "qty": 2, "price": 50000}
    ],
    "total": 100000,
    "paymentMethod": "standard"
  }'
```

### Populate Test Meals

Navigate to Meals page and click "Thêm bữa ăn" multiple times with different values

### Populate Test Workouts

Navigate to Workouts page and click "Thêm buổi tập" multiple times

---

## Expected API Response Formats

### Meals List
```json
[
  {
    "id": "meal-123",
    "name": "Chicken Rice",
    "calories": 550,
    "protein": 40,
    "carbs": 55,
    "fat": 14,
    "createdAt": "2025-11-16T10:30:00Z"
  }
]
```

### Menu Items
```json
[
  {
    "id": "item-1",
    "name": "Pho",
    "price": 50000,
    "calories": 400,
    "protein": 20,
    "carbs": 50,
    "fat": 10
  }
]
```

### Order
```json
{
  "id": "order-123",
  "status": "pending",
  "createdAt": "2025-11-16T10:35:00Z",
  "total": 150000,
  "items": [
    {"name": "Pho", "qty": 2, "price": 50000}
  ]
}
```

### Recommendations
```json
[
  {
    "id": "rec-1",
    "type": "meal",
    "title": "Protein Bowl",
    "description": "520 kcal · P28/C65/F12",
    "calories": 520,
    "protein": 28,
    "carbs": 65,
    "fat": 12
  }
]
```

---

## Success Checklist

After testing all pages:

- [ ] Meals page fetches and adds meals successfully
- [ ] Workouts page fetches and adds workouts successfully
- [ ] Menu page displays items from catalog API
- [ ] Checkout creates real orders in backend
- [ ] Order page shows order list and details
- [ ] Can cancel orders (if in cancellable status)
- [ ] Analytics loads or falls back gracefully
- [ ] Ai shows real recommendations or mock ones
- [ ] All error messages display properly
- [ ] Loading spinners appear during API calls
- [ ] No 401 Unauthorized errors
- [ ] No CORS errors
- [ ] Cart clears after successful checkout
- [ ] Order appears in Order list after creation

---

## Common Test Scenarios

### Scenario A: Fresh User
1. Login → get token
2. Browse Menu → add items
3. Checkout → create order
4. View Order → see order
5. Go to Analytics → see last 7 days (fallback to empty)

### Scenario B: Existing User with Data
1. Meals page → shows existing meals from API
2. Add new meal → appears in list
3. Analytics → shows 7-day summary with this meal
4. Ai page → gets recommendations based on profile

### Scenario C: Backend Down
1. All pages show error messages
2. Loading spinners timeout or fail quickly
3. Fallback data shows if available
4. App doesn't crash, still usable

---

## Next Testing: Integration with Admin Dashboard

After verifying all user pages work:

1. Test Admin → Restaurants page (already integrated)
2. Test Admin → Orders page (should show same orders as user Order page)
3. Test Admin → DeliveryPartners page

---

## Performance Benchmarks (Target)

- Meals list load: < 1s
- Add meal submit: < 2s
- Checkout submit: < 3s
- Order list load: < 1s
- Analytics load: < 2s

If slower, check:
- Backend response times
- Network latency
- Browser console for JavaScript errors

---

**Report any issues to**: [Team/Project Repo]  
**Last Updated**: 2025-11-16
