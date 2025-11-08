export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  nutritionInfo?: NutritionInfo;
  allergens?: string[];
  ingredients?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  nutritionInfo?: NutritionInfo;
  allergens?: string[];
  ingredients?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  imageUrl?: string;
  nutritionInfo?: NutritionInfo;
  allergens?: string[];
  ingredients?: string[];
  isActive?: boolean;
}

export interface ProductSearchFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}