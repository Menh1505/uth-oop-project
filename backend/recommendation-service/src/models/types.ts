// Recommendation Type
export type RecommendationType = 'meal' | 'exercise' | 'nutrition' | 'general';

// User Profile
export interface UserProfile {
  user_id: number;
  first_name?: string;
  last_name?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  activity_level?: string;
  subscription_type?: string;
  dietary_preferences?: string[];
  allergies?: string[];
  health_conditions?: string[];
}

// User data for AI
export interface UserData {
  user_id?: number;
  first_name?: string;
  last_name?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  activity_level?: string;
  subscription_type?: string;
  dietary_preferences?: string[];
  allergies?: string[];
  health_conditions?: string[];
}

// Goal data
export interface GoalData {
  goal_type: string;
  description?: string;
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
  is_active: boolean;
}

// Meal data
export interface MealData {
  meal_date: string;
  meal_type: string;
  calorie_intake: number;
  foods: FoodData[];
}

// Food data
export interface FoodData {
  food_name: string;
  quantity: string;
}

// Exercise data
export interface ExerciseData {
  exercise_date: string;
  exercise_name: string;
  duration_minutes: number;
  calories_burned: number;
  intensity: string;
}

// AI Prompt Data
export interface AIPromptData {
  user: UserData;
  goals: GoalData[];
  recent_meals: MealData[];
  recent_exercises: ExerciseData[];
  context?: string;
}

// Recommendation Request
export interface RecommendationRequest {
  user_id: number;
  type: RecommendationType;
  context?: string;
}

// Recommendation Response
export interface RecommendationResponse {
  type: RecommendationType | string;
  title: string;
  content: string;
  confidence: number;
  reasoning: string;
  actionable_items: string[];
  timestamp?: string;
}

// Recent Meal
export interface RecentMeal {
  meal_id?: number;
  meal_date: string;
  meal_type: string;
  calorie_intake: number;
  foods: FoodData[];
}

// Recent Exercise
export interface RecentExercise {
  exercise_id?: number;
  exercise_date: string;
  exercise_name: string;
  duration_minutes: number;
  calories_burned: number;
  intensity: string;
}

// User Goal
export interface UserGoal {
  goal_id?: number;
  goal_type: string;
  description?: string;
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
  is_active: boolean;
}

// Recommendation Record
export interface Recommendation {
  id: string;
  user_id: number;
  recommendation_type: RecommendationType;
  title: string;
  content: string;
  confidence: number;
  reasoning: string;
  actionable_items: string[];
  created_at?: string;
  updated_at?: string;
}

// JWT Claims
export interface JwtClaims {
  sub: string;
  id: string;
  aud?: string;
}
