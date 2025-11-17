import { FoodRepository } from '../repositories/FoodRepository';
import { 
  CreateFoodPayload, 
  UpdateFoodPayload, 
  FoodSearchFilters,
  Food
} from '../models/Meal';

export class FoodService {
  // Create new food
  static async createFood(foodData: CreateFoodPayload): Promise<Food> {
    // Validate required fields
    if (!foodData.food_name || foodData.food_name.trim().length === 0) {
      throw new Error('Food name is required');
    }

    if (!foodData.serving_size || foodData.serving_size <= 0) {
      throw new Error('Serving size must be greater than 0');
    }

    if (!foodData.calories || foodData.calories < 0) {
      throw new Error('Calories must be 0 or greater');
    }

    // Validate nutritional values
    if (foodData.protein !== undefined && foodData.protein < 0) {
      throw new Error('Protein must be 0 or greater');
    }

    if (foodData.carbs !== undefined && foodData.carbs < 0) {
      throw new Error('Carbs must be 0 or greater');
    }

    if (foodData.fat !== undefined && foodData.fat < 0) {
      throw new Error('Fat must be 0 or greater');
    }

    return await FoodRepository.create(foodData);
  }

  // Get food by ID
  static async getFoodById(foodId: string): Promise<Food | null> {
    return await FoodRepository.findById(foodId);
  }

  // Search foods
  static async searchFoods(
    filters: FoodSearchFilters, 
    limit = 50, 
    offset = 0
  ): Promise<Food[]> {
    // Validate limit and offset
    if (limit <= 0 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be 0 or greater');
    }

    return await FoodRepository.search(filters, limit, offset);
  }

  // Get foods by category
  static async getFoodsByCategory(category: string): Promise<Food[]> {
    if (!category || category.trim().length === 0) {
      throw new Error('Category is required');
    }

    return await FoodRepository.getByCategory(category);
  }

  // Get all food categories
  static async getFoodCategories(): Promise<string[]> {
    return await FoodRepository.getCategories();
  }

  // Update food
  static async updateFood(foodId: string, updateData: UpdateFoodPayload): Promise<Food> {
    // Validate serving size if provided
    if (updateData.serving_size !== undefined && updateData.serving_size <= 0) {
      throw new Error('Serving size must be greater than 0');
    }

    // Validate calories if provided
    if (updateData.calories !== undefined && updateData.calories < 0) {
      throw new Error('Calories must be 0 or greater');
    }

    // Validate nutritional values
    if (updateData.protein !== undefined && updateData.protein < 0) {
      throw new Error('Protein must be 0 or greater');
    }

    if (updateData.carbs !== undefined && updateData.carbs < 0) {
      throw new Error('Carbs must be 0 or greater');
    }

    if (updateData.fat !== undefined && updateData.fat < 0) {
      throw new Error('Fat must be 0 or greater');
    }

    if (updateData.food_name !== undefined && updateData.food_name.trim().length === 0) {
      throw new Error('Food name cannot be empty');
    }

    return await FoodRepository.update(foodId, updateData);
  }

  // Delete food
  static async deleteFood(foodId: string): Promise<void> {
    const food = await FoodRepository.findById(foodId);
    if (!food) {
      throw new Error('Food not found');
    }

    await FoodRepository.delete(foodId);
  }

  // Find food by barcode
  static async findFoodByBarcode(barcode: string): Promise<Food | null> {
    if (!barcode || barcode.trim().length === 0) {
      throw new Error('Barcode is required');
    }

    return await FoodRepository.findByBarcode(barcode);
  }

  // Get popular foods
  static async getPopularFoods(limit = 20): Promise<Food[]> {
    if (limit <= 0 || limit > 50) {
      throw new Error('Limit must be between 1 and 50');
    }

    return await FoodRepository.getPopularFoods(limit);
  }

  // Get recently added foods
  static async getRecentFoods(limit = 20): Promise<Food[]> {
    if (limit <= 0 || limit > 50) {
      throw new Error('Limit must be between 1 and 50');
    }

    return await FoodRepository.getRecentFoods(limit);
  }

  // Calculate nutrition for custom quantity
  static calculateNutritionForQuantity(food: Food, quantity: number): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    cholesterol: number;
    vitamin_a: number;
    vitamin_c: number;
    calcium: number;
    iron: number;
  } {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const ratio = quantity / food.serving_size;

    return {
      calories: Math.round(food.calories * ratio * 100) / 100,
      protein: Math.round(food.protein * ratio * 100) / 100,
      carbs: Math.round(food.carbs * ratio * 100) / 100,
      fat: Math.round(food.fat * ratio * 100) / 100,
      fiber: Math.round((food.fiber || 0) * ratio * 100) / 100,
      sugar: Math.round((food.sugar || 0) * ratio * 100) / 100,
      sodium: Math.round((food.sodium || 0) * ratio * 100) / 100,
      cholesterol: Math.round((food.cholesterol || 0) * ratio * 100) / 100,
      vitamin_a: Math.round((food.vitamin_a || 0) * ratio * 100) / 100,
      vitamin_c: Math.round((food.vitamin_c || 0) * ratio * 100) / 100,
      calcium: Math.round((food.calcium || 0) * ratio * 100) / 100,
      iron: Math.round((food.iron || 0) * ratio * 100) / 100
    };
  }

  // Get nutrition comparison between foods
  static compareNutrition(foods: { food: Food; quantity: number }[]): {
    comparison: {
      food: Food;
      quantity: number;
      nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        sugar: number;
        sodium: number;
        cholesterol: number;
      };
    }[];
    totals: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
      sodium: number;
      cholesterol: number;
    };
  } {
    const comparison = foods.map(({ food, quantity }) => {
      const nutrition = this.calculateNutritionForQuantity(food, quantity);
      return {
        food,
        quantity,
        nutrition: {
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          fiber: nutrition.fiber,
          sugar: nutrition.sugar,
          sodium: nutrition.sodium,
          cholesterol: nutrition.cholesterol
        }
      };
    });

    const totals = comparison.reduce((acc, item) => ({
      calories: acc.calories + item.nutrition.calories,
      protein: acc.protein + item.nutrition.protein,
      carbs: acc.carbs + item.nutrition.carbs,
      fat: acc.fat + item.nutrition.fat,
      fiber: acc.fiber + item.nutrition.fiber,
      sugar: acc.sugar + item.nutrition.sugar,
      sodium: acc.sodium + item.nutrition.sodium,
      cholesterol: acc.cholesterol + item.nutrition.cholesterol
    }), {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0
    });

    return { comparison, totals };
  }
}