# Nutrition Service

Nutrition tracking and analysis microservice for the fitness application ecosystem. This service provides comprehensive meal logging, calorie tracking, nutrition analysis, and goal management capabilities.

## 🎯 Features

### Food Management
- **Food Database**: Comprehensive food database with nutritional information
- **Custom Foods**: Users can add custom foods with complete nutrition profiles
- **Food Search**: Search foods by name, category, brand, or barcode
- **Public Foods**: Community-shared food database for common items
- **Detailed Nutrition**: Track macros, vitamins, minerals, and micronutrients

### Meal Logging
- **Meal Tracking**: Log meals by type (breakfast, lunch, dinner, snack)
- **Portion Control**: Flexible serving size tracking with multiple units
- **Time-based Logging**: Track when meals were consumed
- **Meal Notes**: Add notes and context to meal entries
- **Quick Logging**: Efficient logging with search and favorites

### Nutrition Analysis
- **Daily Summaries**: Complete daily nutrition breakdown
- **Weekly Analysis**: 7-day nutrition trends and patterns
- **Goal Tracking**: Compare actual intake vs. nutrition goals
- **Achievement Metrics**: Track progress towards nutrition targets
- **Macro Distribution**: Analyze carbs/protein/fat ratios

### Goal Management
- **Personalized Goals**: Set custom daily nutrition targets
- **Activity-based Calculations**: Goals based on activity level
- **Weight Goals**: Support for weight loss/gain/maintenance
- **Flexible Targets**: Adjust goals for calories, macros, and micronutrients
- **Progress Monitoring**: Track goal achievement over time

## 🏗️ Architecture

The service follows Clean Architecture principles:

```
src/
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
├── models/          # Data models and types
├── routes/          # API route definitions
├── middleware/      # Authentication & error handling
├── config/          # Database & JWT configuration
├── app.ts          # Express application setup
└── server.ts       # Server startup and configuration
```

### Key Components

- **NutritionController**: REST API endpoints for all nutrition operations
- **NutritionService**: Core business logic for food management and calculations
- **Models**: TypeScript interfaces for Food, MealLog, NutritionAnalysis, etc.
- **Database**: PostgreSQL with comprehensive nutrition schema

## 📊 Database Schema

### Core Tables
- **foods**: Nutrition information for foods (public & user-specific)
- **meal_logs**: User meal consumption records
- **nutrition_goals**: User daily nutrition targets
- **nutrition_analyses**: Calculated nutrition summaries

### Key Features
- Comprehensive nutrition tracking (macros + 15+ vitamins/minerals)
- User data isolation with JWT authentication
- Efficient indexing for fast queries
- Automatic timestamp management

## 🚀 API Endpoints

### Food Management
```
GET    /api/nutrition/foods              # List foods with filters
GET    /api/nutrition/foods/:id          # Get specific food
POST   /api/nutrition/foods              # Create new food
PUT    /api/nutrition/foods/:id          # Update food
DELETE /api/nutrition/foods/:id          # Delete food
```

### Meal Logging
```
GET    /api/nutrition/meal-logs          # List meal logs with filters
GET    /api/nutrition/meal-logs/:id      # Get specific meal log
POST   /api/nutrition/meal-logs          # Create meal log
PUT    /api/nutrition/meal-logs/:id      # Update meal log
DELETE /api/nutrition/meal-logs/:id      # Delete meal log
```

### Nutrition Analysis
```
GET    /api/nutrition/analysis/daily     # Daily nutrition summary
GET    /api/nutrition/analysis/weekly    # Weekly nutrition analysis
```

### Goals Management
```
GET    /api/nutrition/goals              # Get user nutrition goals
POST   /api/nutrition/goals              # Set nutrition goals
PUT    /api/nutrition/goals              # Update nutrition goals
```

### System
```
GET    /api/nutrition/health             # Health check
GET    /                                 # Service info & documentation
```

## 📝 Request/Response Examples

### Create Food
```bash
POST /api/nutrition/foods
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Greek Yogurt",
  "brand": "Chobani",
  "category": "DAIRY",
  "serving_size": 170,
  "serving_unit": "g",
  "calories": 100,
  "protein": 15,
  "carbs": 6,
  "fat": 0,
  "fiber": 0,
  "sugar": 4,
  "sodium": 65,
  "calcium": 200,
  "is_public": false
}
```

### Log Meal
```bash
POST /api/nutrition/meal-logs
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "food_id": "123e4567-e89b-12d3-a456-426614174000",
  "meal_type": "BREAKFAST",
  "quantity": 1,
  "consumed_at": "2024-01-15T08:30:00Z",
  "notes": "With berries"
}
```

### Daily Analysis Response
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "totals": {
      "calories": 1850,
      "protein": 125,
      "carbs": 185,
      "fat": 65,
      "fiber": 28,
      "sugar": 45
    },
    "goals": {
      "calories": 2000,
      "protein": 150,
      "carbs": 250,
      "fat": 65
    },
    "achievements": {
      "calories": 92.5,
      "protein": 83.3,
      "carbs": 74.0,
      "fat": 100.0
    },
    "meals": {
      "BREAKFAST": { "calories": 450, "count": 3 },
      "LUNCH": { "calories": 650, "count": 4 },
      "DINNER": { "calories": 600, "count": 3 },
      "SNACK": { "calories": 150, "count": 1 }
    }
  }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/nutrition_db
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=nutrition_db
DB_PORT=5432

# Authentication
JWT_SECRET=your-secret-key

# Server
PORT=3003
NODE_ENV=production
```

### Docker Configuration
```yaml
nutrition-service:
  build: ./nutrition-service
  ports:
    - "3016:3003"
  environment:
    DATABASE_URL: postgresql://postgres:password@postgres:5432/nutrition_db
    JWT_SECRET: shared-secret-key
  depends_on:
    - postgres
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
psql -U postgres -d nutrition_db -f migrations/nutrition_db.sql

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

- **JWT Authentication**: All endpoints (except health check) require valid JWT
- **User Data Isolation**: Users can only access their own data
- **Input Validation**: Comprehensive request validation and sanitization
- **Error Handling**: Secure error responses without sensitive data exposure
- **Rate Limiting**: Protection against API abuse
- **SQL Injection Protection**: Parameterized queries and ORM usage

## 📈 Performance Features

- **Database Indexing**: Optimized indexes for common query patterns
- **Query Optimization**: Efficient database queries with joins and aggregations
- **Caching Strategy**: Food database and frequently accessed data caching
- **Pagination Support**: Large result set handling with limit/offset
- **Connection Pooling**: Efficient database connection management

## 🚀 Deployment

### Using Docker
```bash
# Build image
docker build -t nutrition-service .

# Run container
docker run -p 3003:3003 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/nutrition_db \
  -e JWT_SECRET=your-secret \
  nutrition-service
```

### Using Docker Compose
```bash
# Start all services
docker-compose up nutrition-service

# Start with build
docker-compose up --build nutrition-service
```

## 📋 Health Monitoring

### Health Check Endpoint
```bash
curl http://localhost:3003/api/nutrition/health
```

Response:
```json
{
  "service": "nutrition-service",
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Metrics & Monitoring
- **Health checks**: Built-in health check endpoint
- **Error tracking**: Comprehensive error logging and monitoring
- **Performance metrics**: Response time and throughput tracking
- **Database monitoring**: Connection pool and query performance metrics

## 🤝 Integration

### With Other Services
- **Auth Service**: JWT token validation for user authentication
- **User Service**: User profile data for personalized nutrition calculations
- **Workout Service**: Integration for exercise-based calorie adjustments

### API Consumption
```javascript
// Example client integration
const nutritionAPI = {
  baseURL: 'http://localhost:3003/api/nutrition',
  
  async getDailyNutrition(date, token) {
    const response = await fetch(`${this.baseURL}/analysis/daily?date=${date}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },
  
  async logMeal(mealData, token) {
    const response = await fetch(`${this.baseURL}/meal-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(mealData)
    });
    return response.json();
  }
};
```

## 📚 Additional Resources

- [Database Schema Documentation](../migrations/nutrition_db.sql)
- [API Integration Examples](./examples/)
- [Nutrition Calculation Algorithms](./docs/calculations.md)
- [Food Database Management](./docs/food-database.md)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL environment variable
   - Ensure PostgreSQL is running and accessible
   - Verify database exists and migrations are applied

2. **Authentication Errors**
   - Verify JWT_SECRET matches auth-service
   - Check token format (Bearer <token>)
   - Ensure token is not expired

3. **Performance Issues**
   - Check database indexes are created
   - Monitor query performance with EXPLAIN
   - Consider pagination for large result sets

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Database debugging
DEBUG=nutrition:database npm run dev
```

---

Built with ❤️ for the UTH OOP Project - Comprehensive nutrition tracking for fitness enthusiasts!