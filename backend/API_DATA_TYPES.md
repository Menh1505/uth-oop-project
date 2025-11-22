# API Data Types & Database Schema Reference

## 📋 Overview
This document provides comprehensive information about database schemas and API data types for the FitFood application. Frontend developers can use this as a reference for proper data type handling and API integration.

---

## 🗄️ Database Architecture

### Service Database Mapping
```
🏗️ Microservices Database Architecture:
├── Auth Service (port 3001) ↔️ fitfood_auth_db
├── User Service (port 3002) ↔️ fitfood_user_db  
├── Meal Service (port 3004) ↔️ fitfood_meal_db
├── Exercise Service (port 3005) ↔️ fitfood_exercise_db
├── Goal Service (port 3006) ↔️ fitfood_goal_db
├── Recommendation Service (port 3007) ↔️ fitfood_recommendation_db
└── Payment Service (port 3008) ↔️ fitfood_payment_db
```

---

## 🔐 Auth Service (`fitfood_auth_db`)

### 📊 Tables & Schema

#### `users_auth`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier |
| `email` | `VARCHAR(255)` | UNIQUE NOT NULL | User email address |
| `username` | `VARCHAR(255)` | NULLABLE | Username for login |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Hashed password |
| `status` | `VARCHAR(50)` | DEFAULT 'active' | Account status |
| `is_active` | `BOOLEAN` | DEFAULT true | Account active flag |
| `email_verified` | `BOOLEAN` | DEFAULT false | Email verification status |
| `last_login` | `TIMESTAMP` | NULLABLE | Last login time |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Last update time |

#### `sessions`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT uuid_generate_v4() | Session ID |
| `user_id` | `UUID` | FOREIGN KEY → users_auth(id) | User reference |
| `refresh_token_hash` | `VARCHAR(255)` | NOT NULL | Hashed refresh token |
| `user_agent` | `VARCHAR(255)` | NULLABLE | User agent string |
| `ip` | `INET` | NULLABLE | IP address |
| `expires_at` | `TIMESTAMP` | NOT NULL | Token expiration time |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Session creation time |

#### `identities`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identity ID |
| `user_id` | `UUID` | FOREIGN KEY → users_auth(id) | User reference |
| `provider` | `VARCHAR(50)` | NOT NULL | OAuth provider (google, facebook, etc.) |
| `provider_uid` | `VARCHAR(255)` | NOT NULL | Provider user ID |
| `meta` | `JSONB` | NULLABLE | Additional provider data |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Identity creation time |

#### `token_blacklist`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT uuid_generate_v4() | Blacklist entry ID |
| `token_hash` | `VARCHAR(255)` | UNIQUE NOT NULL | Hashed access token |
| `user_id` | `UUID` | FOREIGN KEY → users_auth(id) | User reference |
| `expires_at` | `TIMESTAMP` | NOT NULL | Token expiration time |
| `blacklisted_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Blacklist time |

#### `roles` & `user_roles`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `roles.id` | `SERIAL` | PRIMARY KEY | Role ID |
| `roles.name` | `VARCHAR(50)` | UNIQUE NOT NULL | Role name (user, admin, premium) |
| `user_roles.user_id` | `UUID` | FOREIGN KEY → users_auth(id) | User reference |
| `user_roles.role_id` | `INTEGER` | FOREIGN KEY → roles(id) | Role reference |

### 🔌 API Data Types

```typescript
// Auth Request/Response Types
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string; // UUID - Changed from user_id to id
    email: string;
    username?: string; // Optional username
    status: string; // Account status
    is_active: boolean;
    email_verified: boolean;
    created_at: string; // ISO 8601 datetime
  };
}

interface RefreshTokenRequest {
  refresh_token: string;
}

interface JwtClaims {
  id: string; // UUID - Changed from user_id to id
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface LoginWithGoogleRequest {
  id_token: string; // Firebase ID token
}

interface LogoutRequest {
  refresh_token?: string; // Optional refresh token to invalidate
}
```

---

## 👤 User Service (`fitfood_user_db`)

### 📊 Tables & Schema

#### `users`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `user_id` | `UUID` | PRIMARY KEY | User identifier (from auth service) |
| `name` | `VARCHAR(255)` | NOT NULL | Full name |
| `email` | `VARCHAR(255)` | UNIQUE NOT NULL | Email address |
| `profile_picture_url` | `TEXT` | NULLABLE | Profile image URL |
| `age` | `INTEGER` | NULLABLE | User age |
| `gender` | `VARCHAR(10)` | CHECK: male/female/other | Gender |
| `height` | `DECIMAL(5,2)` | NULLABLE | Height in cm |
| `weight` | `DECIMAL(5,2)` | NULLABLE | Weight in kg |
| `activity_level` | `VARCHAR(20)` | CHECK: sedentary/lightly_active/moderately_active/very_active/extra_active | Activity level |
| `dietary_restrictions` | `TEXT[]` | ARRAY | Dietary restrictions |
| `allergies` | `TEXT[]` | ARRAY | Food allergies |
| `health_conditions` | `TEXT[]` | ARRAY | Health conditions |
| `fitness_goals` | `TEXT[]` | ARRAY | Fitness goals |
| `is_premium` | `BOOLEAN` | DEFAULT false | Premium subscription status |
| `subscription_expires_at` | `TIMESTAMP` | NULLABLE | Subscription expiry |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Profile creation time |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Last update time |

### 🔌 API Data Types

```typescript
// User Profile Types
interface UserProfile {
  user_id: string; // UUID
  name: string;
  email: string;
  profile_picture_url?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // cm
  weight?: number; // kg
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  dietary_restrictions: string[];
  allergies: string[];
  health_conditions: string[];
  fitness_goals: string[];
  is_premium: boolean;
  subscription_expires_at?: string; // ISO 8601 datetime
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface UpdateProfileRequest {
  name?: string;
  profile_picture_url?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  dietary_restrictions?: string[];
  allergies?: string[];
  health_conditions?: string[];
  fitness_goals?: string[];
}
```

---

## 🍽️ Meal Service (`fitfood_meal_db`)

### 📊 Tables & Schema

#### `foods`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `food_id` | `UUID` | PRIMARY KEY, DEFAULT uuid_generate_v4() | Food identifier |
| `food_name` | `VARCHAR(255)` | NOT NULL | Food name |
| `category` | `VARCHAR(100)` | NULLABLE | Food category |
| `serving_size` | `DECIMAL(8,2)` | NULLABLE | Default serving size |
| `serving_unit` | `VARCHAR(50)` | NULLABLE | Serving unit (g, ml, piece, etc.) |
| `calories` | `DECIMAL(8,2)` | NULLABLE | Calories per serving |
| `protein` | `DECIMAL(6,2)` | NULLABLE | Protein in grams |
| `carbs` | `DECIMAL(6,2)` | NULLABLE | Carbohydrates in grams |
| `fat` | `DECIMAL(6,2)` | NULLABLE | Fat in grams |
| `fiber` | `DECIMAL(6,2)` | NULLABLE | Fiber in grams |
| `sugar` | `DECIMAL(6,2)` | NULLABLE | Sugar in grams |
| `sodium` | `DECIMAL(8,2)` | NULLABLE | Sodium in mg |
| `cholesterol` | `DECIMAL(8,2)` | NULLABLE | Cholesterol in mg |
| `vitamin_a` | `DECIMAL(8,2)` | NULLABLE | Vitamin A in IU |
| `vitamin_c` | `DECIMAL(8,2)` | NULLABLE | Vitamin C in mg |
| `calcium` | `DECIMAL(8,2)` | NULLABLE | Calcium in mg |
| `iron` | `DECIMAL(8,2)` | NULLABLE | Iron in mg |
| `barcode` | `VARCHAR(50)` | NULLABLE | Product barcode |
| `brand` | `VARCHAR(255)` | NULLABLE | Brand name |
| `allergens` | `TEXT` | NULLABLE | Allergen information |
| `is_vegetarian` | `BOOLEAN` | DEFAULT false | Vegetarian flag |
| `is_vegan` | `BOOLEAN` | DEFAULT false | Vegan flag |
| `is_gluten_free` | `BOOLEAN` | DEFAULT false | Gluten-free flag |
| `image_url` | `TEXT` | NULLABLE | Food image URL |
| `is_active` | `BOOLEAN` | DEFAULT true | Active status |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Last update time |

#### `meals`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `meal_id` | `UUID` | PRIMARY KEY, DEFAULT uuid_generate_v4() | Meal identifier |
| `user_id` | `UUID` | NOT NULL | User reference |
| `meal_name` | `VARCHAR(255)` | NULLABLE | Custom meal name |
| `meal_type` | `VARCHAR(20)` | NOT NULL | breakfast/lunch/dinner/snack |
| `meal_date` | `DATE` | NOT NULL | Meal date |
| `meal_time` | `TIME` | NULLABLE | Meal time |
| `total_calories` | `DECIMAL(8,2)` | DEFAULT 0 | Total calories |
| `total_protein` | `DECIMAL(6,2)` | DEFAULT 0 | Total protein |
| `total_carbs` | `DECIMAL(6,2)` | DEFAULT 0 | Total carbs |
| `total_fat` | `DECIMAL(6,2)` | DEFAULT 0 | Total fat |
| `total_fiber` | `DECIMAL(6,2)` | DEFAULT 0 | Total fiber |
| `total_sugar` | `DECIMAL(6,2)` | DEFAULT 0 | Total sugar |
| `notes` | `TEXT` | NULLABLE | Meal notes |
| `is_completed` | `BOOLEAN` | DEFAULT false | Completion status |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Last update time |

#### `meal_foods`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `meal_food_id` | `UUID` | PRIMARY KEY, DEFAULT uuid_generate_v4() | Meal food identifier |
| `meal_id` | `UUID` | FOREIGN KEY → meals(meal_id) | Meal reference |
| `food_id` | `UUID` | FOREIGN KEY → foods(food_id) | Food reference |
| `quantity` | `DECIMAL(8,2)` | NOT NULL | Quantity consumed |
| `unit` | `VARCHAR(50)` | NOT NULL | Unit of measurement |
| `calories_consumed` | `DECIMAL(8,2)` | NULLABLE | Calculated calories |
| `protein_consumed` | `DECIMAL(6,2)` | NULLABLE | Calculated protein |
| `carbs_consumed` | `DECIMAL(6,2)` | NULLABLE | Calculated carbs |
| `fat_consumed` | `DECIMAL(6,2)` | NULLABLE | Calculated fat |
| `notes` | `TEXT` | NULLABLE | Food-specific notes |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Addition time |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Last update time |

### 🔌 API Data Types

```typescript
// Food Types
interface Food {
  food_id: string; // UUID
  food_name: string;
  category?: string;
  serving_size?: number;
  serving_unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  calcium?: number;
  iron?: number;
  barcode?: string;
  brand?: string;
  allergens?: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  image_url?: string;
  is_active: boolean;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface CreateFoodRequest {
  food_name: string;
  category?: string;
  serving_size?: number;
  serving_unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  calcium?: number;
  iron?: number;
  barcode?: string;
  brand?: string;
  allergens?: string;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  image_url?: string;
}

// Meal Types
interface Meal {
  meal_id: string; // UUID
  user_id: string; // UUID
  meal_name?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_date: string; // YYYY-MM-DD
  meal_time?: string; // HH:MM:SS
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
  notes?: string;
  is_completed: boolean;
  foods?: MealFood[]; // When populated with foods
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface MealFood {
  meal_food_id: string; // UUID
  meal_id: string; // UUID
  food_id: string; // UUID
  food?: Food; // When populated
  quantity: number;
  unit: string;
  calories_consumed?: number;
  protein_consumed?: number;
  carbs_consumed?: number;
  fat_consumed?: number;
  notes?: string;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface CreateMealRequest {
  meal_name?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_date: string; // YYYY-MM-DD
  meal_time?: string; // HH:MM:SS
  notes?: string;
}

interface AddFoodToMealRequest {
  food_id: string; // UUID
  quantity: number;
  unit: string;
  notes?: string;
}

// Nutrition Summary
interface NutritionSummary {
  date: string; // YYYY-MM-DD
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
  meal_breakdown: {
    breakfast: NutritionBreakdown;
    lunch: NutritionBreakdown;
    dinner: NutritionBreakdown;
    snack: NutritionBreakdown;
  };
}

interface NutritionBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}
```

---

## 🏃‍♂️ Exercise Service (`fitfood_exercise_db`)

### 📊 Tables & Schema

#### `exercises`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `exercise_id` | `UUID` | PRIMARY KEY, DEFAULT uuid_generate_v4() | Exercise identifier |
| `user_id` | `UUID` | NOT NULL | User reference |
| `exercise_name` | `VARCHAR(255)` | NOT NULL | Exercise name |
| `exercise_date` | `DATE` | NOT NULL | Exercise date |
| `exercise_time` | `TIME` | NULLABLE | Exercise time |
| `duration_minutes` | `INTEGER` | NULLABLE | Duration in minutes |
| `calories_burned` | `DECIMAL(8,2)` | NULLABLE | Calories burned |
| `intensity` | `VARCHAR(50)` | NULLABLE | Exercise intensity |
| `notes` | `TEXT` | NULLABLE | Exercise notes |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Last update time |

### 🔌 API Data Types

```typescript
// Exercise Types
interface Exercise {
  exercise_id: string; // UUID
  user_id: string; // UUID
  exercise_name: string;
  exercise_date: string; // YYYY-MM-DD
  exercise_time?: string; // HH:MM:SS
  duration_minutes?: number;
  calories_burned?: number;
  intensity?: string;
  notes?: string;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface CreateExerciseRequest {
  exercise_name: string;
  exercise_date: string; // YYYY-MM-DD
  exercise_time?: string; // HH:MM:SS
  duration_minutes?: number;
  calories_burned?: number;
  intensity?: string;
  notes?: string;
}

interface UpdateExerciseRequest {
  exercise_name?: string;
  exercise_date?: string; // YYYY-MM-DD
  exercise_time?: string; // HH:MM:SS
  duration_minutes?: number;
  calories_burned?: number;
  intensity?: string;
  notes?: string;
}
```

---

## 🎯 Goal Service (`fitfood_goal_db`)

### 📊 Tables & Schema

#### `goals`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `goal_id` | `UUID` | PRIMARY KEY, DEFAULT uuid_generate_v4() | Goal identifier |
| `user_id` | `UUID` | NOT NULL | User reference |
| `goal_type` | `VARCHAR(50)` | NOT NULL | Goal type |
| `target_value` | `DECIMAL(10,2)` | NULLABLE | Target value |
| `current_value` | `DECIMAL(10,2)` | DEFAULT 0 | Current progress |
| `unit` | `VARCHAR(20)` | NULLABLE | Unit of measurement |
| `target_date` | `DATE` | NULLABLE | Target completion date |
| `status` | `VARCHAR(20)` | DEFAULT 'active', CHECK: active/completed/paused/cancelled | Goal status |
| `description` | `TEXT` | NULLABLE | Goal description |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Last update time |

#### `user_goals`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `SERIAL` | PRIMARY KEY | Junction table ID |
| `user_id` | `UUID` | NOT NULL | User reference |
| `goal_id` | `UUID` | FOREIGN KEY → goals(goal_id) | Goal reference |
| `assigned_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Assignment time |

### 🔌 API Data Types

```typescript
// Goal Types
interface Goal {
  goal_id: string; // UUID
  user_id: string; // UUID
  goal_type: string;
  target_value?: number;
  current_value: number;
  unit?: string;
  target_date?: string; // YYYY-MM-DD
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  description?: string;
  progress_percentage?: number; // Calculated field
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface CreateGoalRequest {
  goal_type: string;
  target_value?: number;
  unit?: string;
  target_date?: string; // YYYY-MM-DD
  description?: string;
}

interface UpdateGoalRequest {
  goal_type?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string; // YYYY-MM-DD
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
  description?: string;
}

interface UpdateGoalProgressRequest {
  current_value: number;
}

interface GoalStatistics {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  paused_goals: number;
  cancelled_goals: number;
  completion_rate: number; // percentage
  goals_near_deadline: Goal[];
}
```

---

## 🤖 Recommendation Service (`fitfood_recommendation_db`)

### 📊 Tables & Schema

#### `recommendations`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `recommendation_id` | `UUID` | PRIMARY KEY, DEFAULT uuid_generate_v4() | Recommendation identifier |
| `user_id` | `UUID` | NOT NULL | User reference |
| `recommendation_type` | `VARCHAR(20)` | NOT NULL, CHECK: meal/exercise/goal/nutrition/recipe | Recommendation type |
| `title` | `VARCHAR(255)` | NOT NULL | Recommendation title |
| `content` | `TEXT` | NOT NULL | Recommendation content |
| `metadata` | `JSONB` | NULLABLE | Additional metadata |
| `priority` | `INTEGER` | DEFAULT 1 | Priority level |
| `is_read` | `BOOLEAN` | DEFAULT false | Read status |
| `expires_at` | `TIMESTAMP` | NULLABLE | Expiration time |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Last update time |

### 🔌 API Data Types

```typescript
// Recommendation Types
interface Recommendation {
  recommendation_id: string; // UUID
  user_id: string; // UUID
  recommendation_type: 'meal' | 'exercise' | 'goal' | 'nutrition' | 'recipe';
  title: string;
  content: string;
  metadata?: Record<string, any>; // JSON object
  priority: number;
  is_read: boolean;
  expires_at?: string; // ISO 8601 datetime
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface RecommendationRequest {
  user_id: string; // UUID
  recommendation_type?: 'meal' | 'exercise' | 'goal' | 'nutrition' | 'recipe';
  context?: {
    current_weight?: number;
    target_weight?: number;
    activity_level?: string;
    dietary_restrictions?: string[];
    health_conditions?: string[];
    recent_meals?: string[];
    recent_exercises?: string[];
    current_goals?: string[];
  };
}

interface CreateRecommendationRequest {
  recommendation_type: 'meal' | 'exercise' | 'goal' | 'nutrition' | 'recipe';
  title: string;
  content: string;
  metadata?: Record<string, any>;
  priority?: number;
  expires_at?: string; // ISO 8601 datetime
}
```

---

## 💳 Payment Service (`fitfood_payment_db`)

### 📊 Tables & Schema

#### `subscriptions`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `SERIAL` | PRIMARY KEY | Subscription plan ID |
| `type` | `VARCHAR(20)` | NOT NULL, CHECK: basic/premium | Subscription type |
| `price` | `DECIMAL(10,2)` | NOT NULL, DEFAULT 0 | Price in VND |
| `duration_days` | `INTEGER` | NOT NULL, DEFAULT 30 | Duration in days |
| `features` | `TEXT[]` | NOT NULL, DEFAULT '{}' | Feature list |
| `is_active` | `BOOLEAN` | DEFAULT true | Plan availability |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Last update time |

#### `payments`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `SERIAL` | PRIMARY KEY | Payment ID |
| `user_id` | `UUID` | NOT NULL | User reference |
| `amount` | `DECIMAL(10,2)` | NOT NULL | Payment amount |
| `currency` | `VARCHAR(3)` | NOT NULL, DEFAULT 'VND' | Currency code |
| `status` | `VARCHAR(20)` | NOT NULL, CHECK: pending/completed/failed/cancelled | Payment status |
| `payment_method` | `VARCHAR(50)` | NOT NULL | Payment method |
| `transaction_id` | `VARCHAR(255)` | NULLABLE | External transaction ID |
| `gateway_response` | `JSONB` | NULLABLE | Payment gateway response |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Last update time |

#### `user_subscriptions`
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `SERIAL` | PRIMARY KEY | User subscription ID |
| `user_id` | `UUID` | NOT NULL | User reference |
| `subscription_id` | `INTEGER` | FOREIGN KEY → subscriptions(id) | Subscription plan reference |
| `payment_id` | `INTEGER` | FOREIGN KEY → payments(id) | Payment reference |
| `start_date` | `TIMESTAMP` | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Subscription start |
| `end_date` | `TIMESTAMP` | NOT NULL | Subscription end |
| `is_active` | `BOOLEAN` | DEFAULT true | Active status |
| `auto_renew` | `BOOLEAN` | DEFAULT false | Auto-renewal setting |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Last update time |

### 🔌 API Data Types

```typescript
// Payment & Subscription Types
interface SubscriptionPlan {
  id: number;
  type: 'basic' | 'premium';
  price: number; // VND
  duration_days: number;
  features: string[];
  is_active: boolean;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface Payment {
  id: number;
  user_id: string; // UUID
  amount: number; // VND
  currency: string; // 'VND'
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  transaction_id?: string;
  gateway_response?: Record<string, any>; // JSON object
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface UserSubscription {
  id: number;
  user_id: string; // UUID
  subscription_id: number;
  subscription?: SubscriptionPlan; // When populated
  payment_id?: number;
  payment?: Payment; // When populated
  start_date: string; // ISO 8601 datetime
  end_date: string; // ISO 8601 datetime
  is_active: boolean;
  auto_renew: boolean;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface CreatePaymentRequest {
  subscription_id: number;
  payment_method: string;
  return_url?: string;
  cancel_url?: string;
}

interface PaymentResponse {
  payment_id: number;
  payment_url?: string; // For redirect-based payments
  qr_code?: string; // For QR code payments
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  message: string;
}

interface SubscriptionStatus {
  is_premium: boolean;
  current_subscription?: UserSubscription;
  expires_at?: string; // ISO 8601 datetime
  days_remaining?: number;
  auto_renew: boolean;
}
```

---

## 🌐 Common API Response Formats

### Standard Response Wrapper
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string; // ISO 8601 datetime
}

interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string; // ISO 8601 datetime
}
```

### Standard Query Parameters
```typescript
interface PaginationQuery {
  page?: number; // Default: 1
  limit?: number; // Default: 10, Max: 100
}

interface DateRangeQuery {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
}

interface SearchQuery {
  q?: string; // Search term
  category?: string; // Filter by category
  sort_by?: string; // Sort field
  sort_order?: 'asc' | 'desc'; // Sort direction
}
```

---

## 🔧 Environment Variables

### Database Configuration
```bash
# Common for all services
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password

# Service-specific database names
# Auth Service
DB_NAME=fitfood_auth_db

# User Service  
DB_NAME=fitfood_user_db

# Meal Service
DB_NAME=fitfood_meal_db

# Exercise Service
DB_NAME=fitfood_exercise_db

# Goal Service
DB_NAME=fitfood_goal_db

# Recommendation Service
DB_NAME=fitfood_recommendation_db

# Payment Service
DB_NAME=fitfood_payment_db
```

### API Configuration
```bash
# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# OpenAI Configuration (Recommendation Service)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Payment Gateway (Payment Service)
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
```

---

## 📝 Notes for Frontend Developers

### 1. **UUID Handling**
- All primary keys are UUIDs (except payment service which uses SERIAL)
- Always treat UUIDs as strings in TypeScript
- Use proper UUID validation when needed

### 2. **Timestamp Formats**
- All timestamps are returned in ISO 8601 format
- Use `new Date(timestamp)` to parse
- For date-only fields, use YYYY-MM-DD format

### 3. **Decimal Numbers**
- Nutrition values, weights, and prices are returned as numbers
- Frontend should handle proper decimal formatting for display

### 4. **Array Fields**
- PostgreSQL arrays are returned as JavaScript arrays
- Empty arrays are returned as `[]`, not null

### 5. **Optional Fields**
- Fields marked as NULLABLE can be `null` or `undefined`
- Always check for null/undefined before using

### 6. **Authentication**
- Include JWT token in Authorization header: `Bearer <token>`
- Token contains `user_id` for user-specific operations
- Premium features require active subscription verification

### 7. **Error Handling**
- All APIs return standardized error responses
- Check `success` field before accessing `data`
- Use `error.code` for programmatic error handling

### 8. **Rate Limiting**
- Recommendation service has rate limiting
- Premium users have higher rate limits
- Implement proper retry logic with exponential backoff

---

## 🚀 Quick Start Examples

### Authentication Flow
```typescript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
});
const { access_token, user } = await loginResponse.json();

// Store token and use in subsequent requests
localStorage.setItem('access_token', access_token);

// Authenticated request
const mealsResponse = await fetch('/api/meals', {
  headers: { 
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  }
});
```

### Create Meal with Foods
```typescript
// Create meal
const meal = await fetch('/api/meals', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    meal_type: 'breakfast',
    meal_date: '2025-11-22',
    meal_name: 'Healthy Breakfast'
  })
});

// Add food to meal
const addFood = await fetch(`/api/meals/${meal.meal_id}/foods`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    food_id: 'food-uuid-here',
    quantity: 100,
    unit: 'g'
  })
});
```

---

## 📞 Support

For questions about this API documentation, please contact the backend development team or refer to the individual service README files.

**Last Updated**: November 22, 2025
**Version**: 1.0.0