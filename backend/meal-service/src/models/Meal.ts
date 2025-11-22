export interface JwtClaims {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  jti?: string;
}
// Food interface
export interface Food {
  food_id: string;
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
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Create Food payload
export interface CreateFoodPayload {
  food_name: string;
  category?: string;
  food_category?: string;
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

// Update Food payload
export interface UpdateFoodPayload {
  food_name?: string;
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

// Food search filters
export interface FoodSearchFilters {
  food_name?: string;
  category?: string;
  min_calories?: number;
  max_calories?: number;
  min_protein?: number;
  max_protein?: number;
  min_carbs?: number;
  max_carbs?: number;
  min_fat?: number;
  max_fat?: number;
  barcode?: string;
  search_term?: string;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  exclude_allergens?: string[];
}

// Meal interface
export interface Meal {
  meal_id: string;
  user_id: string;
  meal_name?: string;
  meal_type: string;
  meal_date: string;
  meal_time?: string;
  total_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  total_fiber?: number;
  total_sugar?: number;
  notes?: string;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Meal with foods
export interface MealWithFoods extends Meal {
  foods: MealFood[];
}

// Meal Food relation
export interface MealFood {
  meal_food_id: string;
  meal_id: string;
  food_id: string;
  quantity: number;
  unit: string;
  food?: Food;
  calories_consumed?: number;
  protein_consumed?: number;
  carbs_consumed?: number;
  fat_consumed?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Meal Food with details
export interface MealFoodWithDetails extends MealFood {
  nutrition_details?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Create Meal payload
export interface CreateMealPayload {
  meal_name?: string;
  meal_type: string;
  meal_date: string;
  meal_time?: string;
  notes?: string;
}

// Update Meal payload
export interface UpdateMealPayload {
  meal_name?: string;
  meal_type?: string;
  meal_date?: string;
  meal_time?: string;
  notes?: string;
  is_completed?: boolean;
}

// Add food to meal payload
export interface AddFoodToMealPayload {
  food_id: string;
  quantity: number;
  unit: string;
  notes?: string;
}

// Update meal food payload
export interface UpdateMealFoodPayload {
  quantity?: number;
  unit?: string;
  notes?: string;
}

// Nutrition Analysis
export interface NutritionAnalysis {
  meal?: Meal;
  detailed_breakdown?: any[];
  macro_distribution?: any;
  vitamin_minerals?: any;
  diet_compatibility?: any;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber?: number;
  total_sugar?: number;
  total_sodium?: number;
  total_cholesterol?: number;
  macro_breakdown: {
    protein_percentage: number;
    carbs_percentage: number;
    fat_percentage: number;
  };
  micronutrients: {
    vitamin_a?: number;
    vitamin_c?: number;
    calcium?: number;
    iron?: number;
  };
}

// Daily Nutrition Summary
export interface DailyNutritionSummary {
  date: string;
  meals: MealWithFoods[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber?: number;
  total_sugar?: number;
  total_sodium?: number;
  total_cholesterol?: number;
  macro_breakdown: {
    protein_percentage: number;
    carbs_percentage: number;
    fat_percentage: number;
  };
  meals_count: number;
}

// Nutrition Summary
export interface NutritionSummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber?: number;
  total_sugar?: number;
  total_sodium?: number;
  total_cholesterol?: number;
  macro_breakdown: {
    protein_percentage: number;
    carbs_percentage: number;
    fat_percentage: number;
  };
}

// Meal Recommendation Criteria
export interface MealRecommendationCriteria {
  dietary_preferences?: string[];
  allergies?: string[];
  calorie_target?: number;
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
  meal_type?: string;
  cuisine_type?: string;
  preparation_time?: number;
  dietary_restrictions?: string[];
  exclude_allergens?: string[];
  exclude_foods?: string[];
  preferred_categories?: string[];
}

// Meal Recommendation
export interface MealRecommendation {
  meal_id: string;
  meal_name: string;
  meal_type: string;
  description: string;
  estimated_calories: number;
  estimated_protein: number;
  estimated_carbs: number;
  estimated_fat: number;
  preparation_time: number;
  foods: {
    food_id: string;
    food_name: string;
    quantity: number;
    unit: string;
    calories?: number;
  }[];
  recommended_foods?: {
    food_id: string;
    food_name: string;
    quantity: number;
    unit: string;
    calories?: number;
  }[];
  benefits: string[];
  match_score?: number;
}

