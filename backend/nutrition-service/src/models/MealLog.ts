export interface MealLog {
  id: string;
  userId: string;
  foodId: string;
  mealType: MealType;
  quantity: number; // amount consumed
  unit: string; // unit of quantity (g, ml, pieces, etc.)
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealLogWithDetails extends MealLog {
  foodName: string;
  foodBrand?: string;
  calculatedNutrition: NutritionInfo;
}

export interface CreateMealLogRequest {
  foodId: string;
  mealType: MealType;
  quantity: number;
  unit: string;
  date?: Date;
  notes?: string;
}

export interface UpdateMealLogRequest {
  mealType?: MealType;
  quantity?: number;
  unit?: string;
  date?: Date;
  notes?: string;
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  DRINK = 'drink'
}

export interface MealLogSearchFilters {
  mealType?: MealType;
  foodId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
}