// Database Enum Types
export type GenderEnum = "male" | "female" | "other";
export type ActivityLevelEnum =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";
export type MealTypeEnum = "breakfast" | "lunch" | "dinner" | "snack";
export type GoalStatusEnum = "active" | "completed" | "paused" | "cancelled";
export type RecommendationTypeEnum =
  | "meal"
  | "exercise"
  | "goal"
  | "nutrition"
  | "recipe";
export type PaymentStatusEnum =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";
export type SubscriptionTypeEnum = "basic" | "premium";

// Auth Service Types
export type AuthUser = {
  user_id: string; // UUID
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  last_login?: string; // ISO 8601 datetime
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
};

export type RefreshToken = {
  id: string; // UUID
  user_id: string; // UUID
  token_hash: string;
  expires_at: string; // ISO 8601 datetime
  created_at: string; // ISO 8601 datetime
};

// User Service Types
export type UserProfile = {
  user_id?: string; // UUID
  name?: string;
  email?: string;
  profile_picture_url?: string;
  age?: number;
  gender?: GenderEnum;
  height?: number; // cm
  weight?: number | string; // kg or string for flexibility
  bmi?: number;
  bmi_category?: string;
  activity_level?: ActivityLevelEnum;
  dietary_restrictions?: string[];
  allergies?: string[];
  health_conditions?: string[];
  fitness_goal?: string;
  fitness_goals?: string[];
  preferred_diet?: string;
  subscription_status?: string;
  payment_method?: string;
  is_premium?: boolean;
  subscription_expires_at?: string; // ISO 8601 datetime
  created_at?: string; // ISO 8601 datetime
  updated_at?: string; // ISO 8601 datetime
};

// Extended profile type for frontend state management
// Combines UserProfile from backend with app-specific fields
export type CombinedProfile = UserProfile & {
  role?: "user" | "admin";
  loginMethod?: "google" | "email"; // Track which auth method was used
  needsOnboarding?: boolean;
  needsSetup?: boolean; // For Google users: need to set age/weight/height
  goal?: string;
  diet?: DietPref;
  username?: string;
  budgetPerMeal?: number;
  timePerWorkout?: number;
  avatar?: string;
  age?: number;
  weight?: number;
  height?: number;
  phone?: string;
  bio?: string;
};

// Meal Service Types
export type Food = {
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
};

export type Meal = {
  meal_id: string; // UUID
  user_id: string; // UUID
  meal_name?: string;
  meal_type: MealTypeEnum;
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
};

export type MealFood = {
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
};

// Exercise Service Types
export type Exercise = {
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
};

// Goal Service Types
export type Goal = {
  goal_id: string; // UUID
  user_id: string; // UUID
  goal_type: string;
  target_value?: number;
  current_value: number;
  unit?: string;
  target_date?: string; // YYYY-MM-DD
  status: GoalStatusEnum;
  description?: string;
  progress_percentage?: number; // Calculated field
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
};

export type DailySummaryStatus = "Đạt mục tiêu" | "Chưa đạt" | "Vượt mức";

export type DailySummary = {
  id: string;
  ngay: string;
  user_id: string;
  tong_calo: number;
  calo_muc_tieu?: number | null;
  trang_thai_calo?: DailySummaryStatus;
  updated_at?: string;
};

// Recommendation Service Types
export type Recommendation = {
  recommendation_id: string; // UUID
  user_id: string; // UUID
  recommendation_type: RecommendationTypeEnum;
  title: string;
  content: string;
  metadata?: Record<string, unknown>; // JSON object
  priority: number;
  is_read: boolean;
  expires_at?: string; // ISO 8601 datetime
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
};

// Payment Service Types
export type SubscriptionPlan = {
  id: number;
  type: SubscriptionTypeEnum;
  price: number; // VND
  duration_days: number;
  features: string[];
  is_active: boolean;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
};

export type Payment = {
  id: number;
  user_id: string; // UUID
  amount: number; // VND
  currency: string; // 'VND'
  status: PaymentStatusEnum;
  payment_method: string;
  transaction_id?: string;
  gateway_response?: Record<string, unknown>; // JSON object
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
};

export type UserSubscription = {
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
};

// API Request Types
export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  name: string;
};

export type RefreshTokenRequest = {
  refresh_token: string;
};

export type UpdateProfileRequest = {
  name?: string;
  profile_picture_url?: string;
  age?: number;
  gender?: GenderEnum;
  height?: number;
  weight?: number;
  activity_level?: ActivityLevelEnum;
  dietary_restrictions?: string[];
  allergies?: string[];
  health_conditions?: string[];
  fitness_goals?: string[];
};

export type CreateFoodRequest = {
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
};

export type CreateMealRequest = {
  meal_name?: string;
  meal_type: MealTypeEnum;
  meal_date: string; // YYYY-MM-DD
  meal_time?: string; // HH:MM:SS
  notes?: string;
};

export type AddFoodToMealRequest = {
  food_id: string; // UUID
  quantity: number;
  unit: string;
  notes?: string;
};

export type CreateExerciseRequest = {
  exercise_name: string;
  exercise_date: string; // YYYY-MM-DD
  exercise_time?: string; // HH:MM:SS
  duration_minutes?: number;
  calories_burned?: number;
  intensity?: string;
  notes?: string;
};

export type UpdateExerciseRequest = {
  exercise_name?: string;
  exercise_date?: string; // YYYY-MM-DD
  exercise_time?: string; // HH:MM:SS
  duration_minutes?: number;
  calories_burned?: number;
  intensity?: string;
  notes?: string;
};

export type CreateGoalRequest = {
  goal_type: string;
  target_value?: number;
  unit?: string;
  target_date?: string; // YYYY-MM-DD
  description?: string;
};

export type UpdateGoalRequest = {
  goal_type?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string; // YYYY-MM-DD
  status?: GoalStatusEnum;
  description?: string;
};

export type UpdateGoalProgressRequest = {
  current_value: number;
};

export type RecommendationRequest = {
  user_id: string; // UUID
  recommendation_type?: RecommendationTypeEnum;
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
};

export type CreateRecommendationRequest = {
  recommendation_type: RecommendationTypeEnum;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  priority?: number;
  expires_at?: string; // ISO 8601 datetime
};

export type CreatePaymentRequest = {
  subscription_id: number;
  payment_method: string;
  return_url?: string;
  cancel_url?: string;
};

// API Response Types
export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    user_id: string; // UUID
    email: string;
    role: string;
    is_active: boolean;
    email_verified: boolean;
    created_at: string; // ISO 8601 datetime
  };
};

export type JwtClaims = {
  user_id: string; // UUID
  email: string;
  role: string;
  iat: number;
  exp: number;
};

export type PaymentResponse = {
  payment_id: number;
  payment_url?: string; // For redirect-based payments
  qr_code?: string; // For QR code payments
  status: PaymentStatusEnum;
  message: string;
};

export type SubscriptionStatus = {
  is_premium: boolean;
  current_subscription?: UserSubscription;
  expires_at?: string; // ISO 8601 datetime
  days_remaining?: number;
  auto_renew: boolean;
};

export type GoalStatistics = {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  paused_goals: number;
  cancelled_goals: number;
  completion_rate: number; // percentage
  goals_near_deadline: Goal[];
};

// Nutrition & Summary Types
export type NutritionBreakdown = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
};

export type NutritionSummary = {
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
};

// Common API Response Formats
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string; // ISO 8601 datetime
};

export type PaginatedResponse<T> = {
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
};

// Query Parameter Types
export type PaginationQuery = {
  page?: number; // Default: 1
  limit?: number; // Default: 10, Max: 100
};

export type DateRangeQuery = {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
};

export type SearchQuery = {
  q?: string; // Search term
  category?: string; // Filter by category
  sort_by?: string; // Sort field
  sort_order?: "asc" | "desc"; // Sort direction
};

// Combined Query Types
export type MealFilterParams = PaginationQuery &
  DateRangeQuery & {
    meal_type?: MealTypeEnum;
  };

export type FoodFilterParams = PaginationQuery &
  SearchQuery & {
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    barcode?: string;
  };

export type ExerciseFilterParams = PaginationQuery & DateRangeQuery;

export type GoalFilterParams = PaginationQuery & {
  goal_type?: string;
  status?: GoalStatusEnum;
};

export type RecommendationFilterParams = PaginationQuery & {
  recommendation_type?: RecommendationTypeEnum;
  is_read?: boolean;
};

// Legacy types for backward compatibility (can be removed if not needed)
export type DietPref =
  | "balanced"
  | "low_carb"
  | "keto"
  | "vegetarian"
  | "vegan";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "completed"
  | "cancelled";

export type MealLog = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string; // ISO
};

export type WorkoutLog = {
  id: string;
  name: string;
  caloriesBurned: number;
  durationMin: number;
  time: string; // ISO
};

export type ExerciseTemplate = {
  id: string;
  name: string;
  description?: string | null;
  muscle_group?: string | null;
  intensity?: string | null;
  exercise_type?: string | null;
  default_duration?: number | null;
  default_calories?: number | null;
  instructions?: string[] | null;
};

export type ExerciseSession = {
  id: string;
  exercise_name: string;
  duration_minutes: number;
  calories_burned: number;
  date: string;
  start_time?: string | null;
  notes?: string | null;
  template_id?: string | null;
  created_at?: string;
};

export type DailyExerciseSummary = {
  date: string;
  total_duration: number;
  total_calories: number;
  sessions: ExerciseSession[];
};

export type MenuItem = {
  id: string;
  name: string;
  price: number; // VND
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description?: string | null;
  image_url?: string | null;
  meal_type?: string;
};

export type CartItem = {
  item: MenuItem;
  qty: number;
};

export type Order = {
  id: string;
  items: CartItem[];
  total: number; // VND
  status: OrderStatus;
  createdAt: string; // ISO
};
