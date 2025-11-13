export interface Food {
  id: string;
  name: string;
  brand?: string;
  category: FoodCategory;
  servingSize: number; // in grams
  servingUnit: string; // 'g', 'ml', 'piece', 'cup', etc.
  nutritionPer100g: NutritionInfo;
  barcode?: string;
  isVerified: boolean;
  createdBy?: string; // user who added this food
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
  cholesterol?: number; // mg
  vitaminA?: number; // mcg
  vitaminC?: number; // mg
  calcium?: number; // mg
  iron?: number; // mg
}

export interface CreateFoodRequest {
  name: string;
  brand?: string;
  category: FoodCategory;
  servingSize: number;
  servingUnit: string;
  nutritionPer100g: NutritionInfo;
  barcode?: string;
  isPublic?: boolean;
}

export interface UpdateFoodRequest {
  name?: string;
  brand?: string;
  category?: FoodCategory;
  servingSize?: number;
  servingUnit?: string;
  nutritionPer100g?: NutritionInfo;
  barcode?: string;
  isPublic?: boolean;
}

export enum FoodCategory {
  FRUITS = 'fruits',
  VEGETABLES = 'vegetables',
  GRAINS = 'grains',
  PROTEIN = 'protein',
  DAIRY = 'dairy',
  FATS_OILS = 'fats_oils',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  SWEETS = 'sweets',
  PREPARED_MEALS = 'prepared_meals',
  CONDIMENTS = 'condiments',
  OTHER = 'other'
}

export interface FoodSearchFilters {
  category?: FoodCategory;
  brand?: string;
  search?: string;
  isPublic?: boolean;
  barcode?: string;
  maxCalories?: number;
  minProtein?: number;
  limit?: number;
  offset?: number;
}