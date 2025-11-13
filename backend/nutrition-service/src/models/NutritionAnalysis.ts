export interface DailyNutritionSummary {
  date: string; // YYYY-MM-DD format
  totalCalories: number;
  totalProtein: number;
  totalCarbohydrates: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  mealBreakdown: MealNutritionBreakdown[];
  recommendedIntake: RecommendedIntake;
  nutritionGoals: NutritionGoals;
  achievements: NutritionAchievement[];
}

export interface MealNutritionBreakdown {
  mealType: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  foods: FoodNutritionSummary[];
}

export interface FoodNutritionSummary {
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface WeeklyNutritionSummary {
  weekStartDate: string;
  weekEndDate: string;
  averageDailyCalories: number;
  averageDailyProtein: number;
  averageDailyCarbs: number;
  averageDailyFat: number;
  totalCalories: number;
  dailySummaries: DailyNutritionSummary[];
  trends: NutritionTrend[];
}

export interface NutritionTrend {
  nutrient: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
  description: string;
}

export interface RecommendedIntake {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sodium: number; // mg
}

export interface NutritionGoals {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  waterGoal?: number; // ml
}

export interface CreateNutritionGoalsRequest {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  waterGoal?: number;
}

export interface UpdateNutritionGoalsRequest {
  calorieGoal?: number;
  proteinGoal?: number;
  carbGoal?: number;
  fatGoal?: number;
  waterGoal?: number;
}

export interface NutritionAchievement {
  type: 'calorie_goal' | 'protein_goal' | 'fiber_goal' | 'water_goal' | 'balanced_meal';
  achieved: boolean;
  percentage: number;
  description: string;
}

export interface MacroDistribution {
  proteinPercentage: number;
  carbPercentage: number;
  fatPercentage: number;
  isBalanced: boolean;
  recommendation?: string;
}

export interface NutritionInsight {
  type: 'warning' | 'suggestion' | 'achievement';
  title: string;
  message: string;
  nutrient?: string;
  value?: number;
  recommendedValue?: number;
}