# FitFood Backend API Routes Documentation

## Auth Service (Port 3001)
Base URL: `http://localhost:3000/api/auth`

### Public Routes
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/admin/login` - Admin login  
- `POST /auth/refresh` - Refresh access token
- `GET /auth/verify` - Verify token validity
- `GET /auth/status` - Service health status
- `GET /auth/health` - Health check

### Protected Routes (Admin)
- `GET /auth/sessions` - List user sessions
- `DELETE /auth/sessions/:sessionId` - Delete specific session
- `DELETE /auth/sessions` - Delete other sessions (user)
- `POST /auth/logout` - Logout
- `GET /auth/blacklist` - List blacklisted tokens
- `POST /auth/blacklist` - Blacklist a token

---

## User Service (Port 3002)
Base URL: `http://localhost:3000/api/users`

### Protected Routes
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `POST /users/me/avatar` - Upload avatar
- `GET /users/admin/users` - List all users (admin)
- `GET /users/:userId` - Get user by ID

---

## Meal Service (Port 3004)
Base URL: `http://localhost:3000/api/meals`

### Health & Status
- `GET /meals/status` - Service status
- `GET /meals/health` - Health check

### Meal Management (Protected)
- `POST /meals` - Create meal
- `GET /meals/:mealId` - Get meal
- `PUT /meals/:mealId` - Update meal
- `DELETE /meals/:mealId` - Delete meal
- `GET /meals/date/:date` - Get meals by date
- `GET /meals/range/:startDate/:endDate` - Get meals in date range

### Meal Analysis (Protected)
- `GET /meals/:mealId/analysis` - Analyze meal nutrition
- `POST /meals/recommendations` - Get meal recommendations

### Meal Foods (Protected)
- `POST /meals/:mealId/foods` - Add food to meal
- `PUT /meals/foods/:mealFoodId` - Update meal food
- `DELETE /meals/foods/:mealFoodId` - Remove food from meal

---

## Food Service (Part of Meal Service)
Base URL: `http://localhost:3000/api/foods`

### Food Management (Protected)
- `POST /foods` - Create food
- `GET /foods/:foodId` - Get food
- `PUT /foods/:foodId` - Update food
- `DELETE /foods/:foodId` - Delete food
- `GET /foods` - Search foods
- `GET /foods/category/:category` - Get foods by category
- `GET /foods/categories/all` - Get all food categories
- `GET /foods/barcode/:barcode` - Find food by barcode
- `GET /foods/popular/list` - Get popular foods
- `GET /foods/recent/list` - Get recent foods

### Nutrition Calculation (Protected)
- `POST /foods/:foodId/nutrition` - Calculate nutrition for food
- `POST /foods/nutrition/compare` - Compare nutrition of foods

---

## Exercise Service (Port 3005)
Base URL: `http://localhost:3000/api/exercises`

### Health & Status
- `GET /exercises/status` - Service status

### Exercise Management (Protected)
- `POST /exercises` - Create exercise
- `GET /exercises/:exerciseId` - Get exercise
- `PUT /exercises/:exerciseId` - Update exercise
- `DELETE /exercises/:exerciseId` - Delete exercise
- `GET /exercises` - List exercises
- `GET /exercises/date/:date` - Get exercises by date
- `GET /exercises/range/:startDate/:endDate` - Get exercises in date range

### Exercise Analytics (Protected)
- `GET /exercises/statistics/user` - Get exercise statistics
- `GET /exercises/summary/daily/:date` - Get daily exercise summary
- `GET /exercises/performance/:exerciseName` - Get exercise performance metrics

### Exercise Recommendations (Protected)
- `POST /exercises/recommendations` - Get exercise recommendations
- `GET /exercises/popular/list` - Get popular exercises (public)

---

## Order Service (Port 3006)
Base URL: `http://localhost:3000/api/orders`

### Health & Status
- `GET /orders/health` - Service health check

### Order Management (Protected)
- `POST /orders` - Create order
- `GET /orders` - Get user's orders
- `GET /orders/:id` - Get order details
- `PUT /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order

### Order Status Management (Protected)
- `PUT /orders/:id/status` - Update order status
- `GET /orders/:id/status-history` - Get order status history
- `POST /orders/:id/cancel` - Cancel order
- `POST /orders/:id/confirm` - Confirm order
- `POST /orders/:id/ready` - Mark order as ready

---

## Nutrition Service (Port 3007)
Base URL: `http://localhost:3000/api/nutrition`

### Health & Status
- `GET /nutrition/health` - Service health check

### Food Routes (Protected)
- `GET /nutrition/foods` - List foods
- `GET /nutrition/foods/:id` - Get food
- `POST /nutrition/foods` - Create food
- `PUT /nutrition/foods/:id` - Update food
- `DELETE /nutrition/foods/:id` - Delete food

### Meal Log Routes (Protected)
- `GET /nutrition/meal-logs` - Get meal logs
- `GET /nutrition/meal-logs/:id` - Get meal log
- `POST /nutrition/meal-logs` - Create meal log
- `PUT /nutrition/meal-logs/:id` - Update meal log
- `DELETE /nutrition/meal-logs/:id` - Delete meal log

### Analysis Routes (Protected)
- `GET /nutrition/analysis/daily` - Get daily nutrition analysis
- `GET /nutrition/analysis/weekly` - Get weekly nutrition analysis
- `GET /nutrition/analysis/monthly` - Get monthly nutrition analysis

---

## Workout Service (Port 3008)
Base URL: `http://localhost:3000/api/workouts`

### Health & Status
- `GET /workouts/health` - Service health check

### Workout Plans (Protected)
- `GET /workouts/plans` - Get user's workout plans
- `GET /workouts/plans/:id` - Get workout plan
- `POST /workouts/plans` - Create workout plan
- `PUT /workouts/plans/:id` - Update workout plan
- `DELETE /workouts/plans/:id` - Delete workout plan

### Exercises (Protected)
- `GET /workouts/exercises` - Get user's exercises
- `GET /workouts/exercises/:id` - Get exercise
- `POST /workouts/exercises` - Create exercise
- `PUT /workouts/exercises/:id` - Update exercise
- `DELETE /workouts/exercises/:id` - Delete exercise

### Workout Logs (Protected)
- `GET /workouts/logs` - Get workout logs
- `GET /workouts/logs/:id` - Get workout log
- `POST /workouts/logs` - Create workout log
- `PUT /workouts/logs/:id` - Update workout log
- `DELETE /workouts/logs/:id` - Delete workout log

---

## Delivery Service (Port 3004)
Base URL: `http://localhost:3000/api/deliveries`

### Health & Status
- `GET /deliveries/health` - Service health check
- `GET /deliveries/enums` - Get enum values

### Driver Management (Protected - Admin)
- `POST /deliveries/drivers` - Create driver
- `GET /deliveries/drivers` - Get all drivers
- `GET /deliveries/drivers/:id` - Get driver details
- `PUT /deliveries/drivers/:id` - Update driver
- `DELETE /deliveries/drivers/:id` - Delete driver
- `PATCH /deliveries/drivers/:id/status` - Update driver status

### Delivery Management (Protected)
- `POST /deliveries` - Create delivery
- `GET /deliveries` - Get deliveries
- `GET /deliveries/:id` - Get delivery details
- `PUT /deliveries/:id` - Update delivery
- `PATCH /deliveries/:id/status` - Update delivery status

### Tracking (Protected)
- `GET /deliveries/:id/tracking` - Get tracking events
- `POST /deliveries/:id/tracking` - Create tracking event

### Analytics (Protected - Admin)
- `GET /deliveries/analytics/deliveries` - Delivery analytics
- `GET /deliveries/analytics/drivers` - Driver analytics

### Integration Routes (Internal)
- `POST /deliveries/integration/order-created` - Handle new order

---

## Partner Service (Port 3010)
Base URL: `http://localhost:3000/api/partners`

### Restaurants (Protected)
- `GET /partners/restaurants` - List restaurants
- `GET /partners/restaurants/search` - Search restaurants (public)
- `POST /partners/restaurants` - Create restaurant
- `GET /partners/restaurants/:id` - Get restaurant (public)
- `PUT /partners/restaurants/:id` - Update restaurant
- `PATCH /partners/restaurants/:id/status` - Update status

### Partner Management (Protected)
- `GET /partners/:partnerId/restaurants` - Get partner's restaurants

### Menu (Protected)
- `POST /partners/restaurants/:restaurantId/menu` - Create menu item
- `GET /partners/restaurants/:restaurantId/menu` - Get menu items (public)
- `PUT /partners/menu/:id` - Update menu item
- `PATCH /partners/menu/:id/status` - Update menu item status

### Promotions (Protected)
- `POST /partners/restaurants/:restaurantId/promotions` - Create promotion
- `GET /partners/restaurants/:restaurantId/promotions` - Get promotions

---

## Recommendation Service (Port 3009)
Base URL: `http://localhost:3000/api/recommendations`

### User Management (Protected)
- `POST /recommendations/users` - Create user
- `GET /recommendations/users` - List users
- `GET /recommendations/users/:userId` - Get user
- `PUT /recommendations/users/:userId` - Update user
- `DELETE /recommendations/users/:userId` - Delete user

### Behavior Tracking (Protected)
- `GET /recommendations/users/:userId/behaviors` - Get user behaviors
- `POST /recommendations/users/:userId/behaviors` - Track behavior

### Recommendations (Protected)
- `POST /recommendations/users/:userId/recommendations` - Generate recommendations
- `GET /recommendations/users/:userId/recommendations` - Get recommendations
- `PUT /recommendations/users/:userId/recommendations/:recommendationId` - Update recommendation
- `GET /recommendations/users/:userId/recommendations/exercises` - Get exercise recommendations
- `GET /recommendations/users/:userId/recommendations/meals` - Get meal recommendations

---

## Admin Service (Port 3013)
Base URL: `http://localhost:3000/api/admin`

### System Routes (Protected - Admin)
- `GET /admin/system/info` - Get system info
- `GET /admin/system/health` - Get system health
- `GET /admin/users` - Get all users
- `DELETE /admin/users/:userId` - Delete user
- `GET /admin/stats` - Get admin statistics
- `GET /admin/status` - Service status

---

## Catalog Service (Port 3014)
Base URL: `http://localhost:3000/api/catalog`

### Health & Status
- `GET /catalog/health` - Service health check

### Products (Public)
- `GET /catalog/products` - List products
- `GET /catalog/products/:id` - Get product

### Categories (Public)
- `GET /catalog/categories` - List categories
- `GET /catalog/categories/:id` - Get category

### Inventory (Public)
- `GET /catalog/inventory/:productId` - Get inventory status

### Admin Routes (Protected - Admin/Manager)
- `POST /catalog/products` - Create product
- `PUT /catalog/products/:id` - Update product
- `DELETE /catalog/products/:id` - Delete product
- `POST /catalog/categories` - Create category
- `PUT /catalog/categories/:id` - Update category
- `DELETE /catalog/categories/:id` - Delete category

---

## Catalog Notes
- Gateway routes: `/api//*` → All services
- Auth required: Most endpoints need `Authorization: Bearer <token>`
- Admin/Role access: Some endpoints require specific roles
- Public endpoints: Product search, restaurant search, popular items
