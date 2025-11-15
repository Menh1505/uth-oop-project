// User profile and preferences
export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
  dietaryRestrictions: string[];
  allergies: string[];
  fitnessGoals: FitnessGoal[];
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';

export interface FitnessGoal {
  id: string;
  type: GoalType;
  target: number;
  current: number;
  unit: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
}

export type GoalType = 
  | 'weight_loss' 
  | 'weight_gain' 
  | 'muscle_gain' 
  | 'endurance' 
  | 'strength' 
  | 'flexibility' 
  | 'maintenance';

export interface UserPreferences {
  exerciseTypes: string[]; // ['cardio', 'strength', 'yoga', 'swimming', etc.]
  exerciseDuration: number; // minutes
  exerciseFrequency: number; // times per week
  cuisinePreferences: string[]; // ['vietnamese', 'italian', 'asian', etc.]
  mealTypes: string[]; // ['breakfast', 'lunch', 'dinner', 'snack']
  cookingTime: number; // max minutes willing to spend
  budgetRange: 'low' | 'medium' | 'high';
}

// User behavior tracking
export interface UserBehavior {
  id: string;
  userId: string;
  type: BehaviorType;
  action: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export type BehaviorType = 
  | 'exercise_completed' 
  | 'exercise_skipped' 
  | 'meal_logged' 
  | 'recommendation_clicked' 
  | 'recommendation_dismissed' 
  | 'goal_updated'
  | 'preference_changed';

// Recommendations
export interface Recommendation {
  id: string;
  userId: string;
  type: RecommendationType;
  category: string;
  title: string;
  description: string;
  content: ExerciseRecommendation | FoodRecommendation;
  confidence: number; // 0-1
  reasoning: string;
  tags: string[];
  createdAt: string;
  status: 'pending' | 'viewed' | 'accepted' | 'dismissed';
}

export type RecommendationType = 'exercise' | 'food';

export interface ExerciseRecommendation {
  name: string;
  type: string; // 'cardio', 'strength', 'flexibility', etc.
  duration: number; // minutes
  intensity: 'low' | 'medium' | 'high';
  equipment: string[];
  instructions: string[];
  benefits: string[];
  caloriesBurned: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
  imageUrl?: string;
}

export interface FoodRecommendation {
  name: string;
  type: 'meal' | 'snack' | 'drink';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cuisine: string;
  ingredients: string[];
  instructions: string[];
  nutrition: NutritionInfo;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  recipeUrl?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
  sodium: number; // mg
}

// AI Context for recommendations
export interface AIContext {
  user: User;
  recentBehaviors: UserBehavior[];
  currentGoals: FitnessGoal[];
  preferences: UserPreferences;
  timeOfDay: string;
  dayOfWeek: string;
  season: string;
  weatherCondition?: string;
}

// Request/Response types
export interface RecommendationRequest {
  userId: string;
  type?: RecommendationType;
  count?: number;
  context?: Partial<AIContext>;
}

export interface RecommendationResponse {
  success: boolean;
  data: Recommendation[];
  message?: string;
  metadata?: {
    totalCount: number;
    aiGenerated: boolean;
    cacheHit: boolean;
  };
}

export interface BehaviorTrackingRequest {
  userId: string;
  type: BehaviorType;
  action: string;
  metadata?: Record<string, any>;
}