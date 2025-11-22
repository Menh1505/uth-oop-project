import { FoodRepository } from '../repositories/FoodRepository';
import { MealRepository } from '../repositories/MealRepository';
import { 
  CreateMealPayload, 
  UpdateMealPayload, 
  AddFoodToMealPayload,
  UpdateMealFoodPayload,
  MealRecommendationCriteria,
  MealRecommendation,
  NutritionAnalysis,
  Meal,
  MealWithFoods,
  DailyNutritionSummary,
  NutritionSummary
} from '../models/Meal';

export class MealService {
  // Create a new meal
  static async createMeal(userId: string, mealData: CreateMealPayload): Promise<Meal> {
    // Validate meal date format
    if (!this.isValidDate(mealData.meal_date)) {
      throw new Error('Invalid meal date format. Use YYYY-MM-DD');
    }

    // Validate meal time format if provided
    if (mealData.meal_time && !this.isValidTime(mealData.meal_time)) {
      throw new Error('Invalid meal time format. Use HH:MM');
    }

    return await MealRepository.create(userId, mealData);
  }

  // Get all meals for user
  static async getUserMeals(userId: string): Promise<Meal[]> {
    return await MealRepository.getUserMeals(userId, 100);
  }

  // Get meal by ID with foods
  static async getMealById(userId: string, mealId: string): Promise<MealWithFoods | null> {
    const meal = await MealRepository.findByIdWithFoods(mealId);
    
    if (!meal || meal.user_id !== userId) {
      return null;
    }

    return meal;
  }

  // Get user meals for a specific date
  static async getUserMealsByDate(userId: string, date: string): Promise<MealWithFoods[]> {
    if (!this.isValidDate(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    return await MealRepository.getUserMealsByDate(userId, date);
  }

  // Get user meals for date range
  static async getUserMealsByDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<MealWithFoods[]> {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('Start date must be before or equal to end date');
    }

    return await MealRepository.getUserMealsByDateRange(userId, startDate, endDate);
  }

  // Update meal
  static async updateMeal(
    userId: string, 
    mealId: string, 
    updateData: UpdateMealPayload
  ): Promise<Meal> {
    // Check if meal belongs to user
    const isUserMeal = await MealRepository.isUserMeal(userId, mealId);
    if (!isUserMeal) {
      throw new Error('Meal not found or does not belong to user');
    }

    // Validate meal time format if provided
    if (updateData.meal_time && !this.isValidTime(updateData.meal_time)) {
      throw new Error('Invalid meal time format. Use HH:MM');
    }

    return await MealRepository.update(mealId, updateData);
  }

  // Delete meal
  static async deleteMeal(userId: string, mealId: string): Promise<void> {
    // Check if meal belongs to user
    const isUserMeal = await MealRepository.isUserMeal(userId, mealId);
    if (!isUserMeal) {
      throw new Error('Meal not found or does not belong to user');
    }

    await MealRepository.delete(mealId);
  }

  // Add food to meal
  static async addFoodToMeal(
    userId: string, 
    mealId: string, 
    foodData: AddFoodToMealPayload
  ): Promise<void> {
    // Check if meal belongs to user
    const isUserMeal = await MealRepository.isUserMeal(userId, mealId);
    if (!isUserMeal) {
      throw new Error('Meal not found or does not belong to user');
    }

    // Validate quantity
    if (foodData.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Check if food exists
    const food = await FoodRepository.findById(foodData.food_id);
    if (!food) {
      throw new Error('Food not found');
    }

    await MealRepository.addFood(mealId, foodData);
  }

  // Update meal food
  static async updateMealFood(
    userId: string, 
    mealFoodId: string, 
    updateData: UpdateMealFoodPayload
  ): Promise<void> {
    // Check if meal food belongs to user
    const isUserMealFood = await MealRepository.isUserMealFood(userId, mealFoodId);
    if (!isUserMealFood) {
      throw new Error('Meal food not found or does not belong to user');
    }

    // Validate quantity if provided
    if (updateData.quantity !== undefined && updateData.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    await MealRepository.updateMealFood(mealFoodId, updateData);
  }

  // Remove food from meal
  static async removeFoodFromMeal(userId: string, mealFoodId: string): Promise<void> {
    // Check if meal food belongs to user
    const isUserMealFood = await MealRepository.isUserMealFood(userId, mealFoodId);
    if (!isUserMealFood) {
      throw new Error('Meal food not found or does not belong to user');
    }

    await MealRepository.removeFood(mealFoodId);
  }

  // Get daily nutrition summary
  static async getDailyNutrition(userId: string, date: string): Promise<DailyNutritionSummary> {
    if (!this.isValidDate(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    const summary = await MealRepository.getDailyNutrition(userId, date);

    // You could add goal comparison here by fetching user's nutrition goals
    // and calculating progress percentages

    return summary;
  }

  // Get nutrition summary for date range
  static async getNutritionSummary(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<NutritionSummary> {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('Start date must be before or equal to end date');
    }

    return await MealRepository.getNutritionSummary(userId, startDate, endDate);
  }

  // Analyze meal nutrition
  static async analyzeMealNutrition(userId: string, mealId: string): Promise<NutritionAnalysis> {
    const meal = await this.getMealById(userId, mealId);
    if (!meal) {
      throw new Error('Meal not found');
    }

    const totalCalories = meal.total_calories;
    
    const detailed_breakdown = meal.foods.map((mealFood: any) => ({
      food: mealFood.food,
      quantity: mealFood.quantity,
      unit: mealFood.unit,
      calories_contribution: (mealFood.calories_consumed || 0),
      protein_contribution: (mealFood.protein_consumed || 0),
      carbs_contribution: (mealFood.carbs_consumed || 0),
      fat_contribution: (mealFood.fat_consumed || 0),
      percentage_of_meal: (meal.total_calories || 0) > 0 ? ((mealFood.calories_consumed || 0) / (meal.total_calories || 1)) * 100 : 0
    }));

    // Calculate macro distribution
    const totalMacroCalories = ((meal.total_protein || 0) * 4) + ((meal.total_carbs || 0) * 4) + ((meal.total_fat || 0) * 9);
    const macro_distribution = {
      protein_percentage: totalMacroCalories > 0 ? ((meal.total_protein || 0) * 4 / totalMacroCalories) * 100 : 0,
      carbs_percentage: totalMacroCalories > 0 ? ((meal.total_carbs || 0) * 4 / totalMacroCalories) * 100 : 0,
      fat_percentage: totalMacroCalories > 0 ? ((meal.total_fat || 0) * 9 / totalMacroCalories) * 100 : 0
    };

    // Calculate vitamins and minerals
    const vitamin_minerals = meal.foods.reduce((acc: any, mealFood: any) => {
      const ratio = mealFood.quantity / (mealFood.food?.serving_size || 1);
      return {
        vitamin_a: acc.vitamin_a + ((mealFood.food?.vitamin_a || 0) * ratio),
        vitamin_c: acc.vitamin_c + ((mealFood.food?.vitamin_c || 0) * ratio),
        calcium: acc.calcium + ((mealFood.food?.calcium || 0) * ratio),
        iron: acc.iron + ((mealFood.food?.iron || 0) * ratio),
        sodium: acc.sodium + ((mealFood.food?.sodium || 0) * ratio),
        cholesterol: acc.cholesterol + ((mealFood.food?.cholesterol || 0) * ratio)
      };
    }, { vitamin_a: 0, vitamin_c: 0, calcium: 0, iron: 0, sodium: 0, cholesterol: 0 });

    // Check diet compatibility
    const diet_compatibility = {
      is_vegetarian: meal.foods.every((mealFood: any) => mealFood.food?.is_vegetarian),
      is_vegan: meal.foods.every((mealFood: any) => mealFood.food?.is_vegan),
      is_gluten_free: meal.foods.every((mealFood: any) => mealFood.food?.is_gluten_free),
      allergens_present: [
        ...new Set(
          meal.foods
            .flatMap((mealFood: any) => mealFood.food?.allergens || [])
            .filter((allergen: any) => allergen)
        )
      ]
    };

    return {
      meal,
      detailed_breakdown,
      macro_distribution,
      vitamin_minerals,
      diet_compatibility,
      total_calories: meal?.total_calories || 0,
      total_protein: meal?.total_protein || 0,
      total_carbs: meal?.total_carbs || 0,
      total_fat: meal?.total_fat || 0,
      macro_breakdown: macro_distribution || { protein_percentage: 0, carbs_percentage: 0, fat_percentage: 0 },
      micronutrients: vitamin_minerals || {}
    };
  }

  // Recommend meals based on criteria
  static async recommendMeals(
    userId: string, 
    criteria: MealRecommendationCriteria
  ): Promise<MealRecommendation[]> {
    // This is a basic implementation. You could make this more sophisticated
    // by using machine learning or more complex algorithms

    const recommendations: MealRecommendation[] = [];
    
    // For now, we'll create simple recommendations based on food combinations
    const targetCalories = criteria.target_calories || 500;
    const targetProtein = criteria.target_protein || targetCalories * 0.2 / 4; // 20% of calories from protein
    const targetCarbs = criteria.target_carbs || targetCalories * 0.5 / 4; // 50% from carbs
    const targetFat = criteria.target_fat || targetCalories * 0.3 / 9; // 30% from fat

    // Search for foods that match criteria
    const foods = await FoodRepository.search({
      is_vegetarian: criteria.dietary_restrictions?.includes('vegetarian'),
      is_vegan: criteria.dietary_restrictions?.includes('vegan'),
      is_gluten_free: criteria.dietary_restrictions?.includes('gluten_free'),
      exclude_allergens: criteria.exclude_allergens,
      search_term: criteria.preferred_categories?.join(' ')
    }, 50);

    // Filter out excluded foods
    const availableFoods = foods.filter((food: any) => 
      !criteria.exclude_foods?.includes(food.id)
    );

    if (availableFoods.length === 0) {
      return recommendations;
    }

    // Create a simple meal recommendation
    const selectedFoods = availableFoods.slice(0, Math.min(5, availableFoods.length));
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const recommended_foods = selectedFoods.map((food: any) => {
      // Calculate suggested quantity to meet targets
      const calorieRatio = Math.min(1, targetCalories / (food.calories * selectedFoods.length));
      const suggestedQuantity = Math.round(food.serving_size * calorieRatio);
      const actualRatio = suggestedQuantity / food.serving_size;

      const calories_contribution = food.calories * actualRatio;
      const protein_contribution = food.protein * actualRatio;
      const carbs_contribution = food.carbs * actualRatio;
      const fat_contribution = food.fat * actualRatio;

      totalCalories += calories_contribution;
      totalProtein += protein_contribution;
      totalCarbs += carbs_contribution;
      totalFat += fat_contribution;

      return {
        food_id: food.id,
        food_name: food.food_name,
        quantity: suggestedQuantity,
        unit: food.serving_unit || 'g'
      };
    });

    // Calculate match score based on how close we are to targets
    const calorieScore = Math.max(0, 100 - Math.abs(totalCalories - targetCalories) / targetCalories * 100);
    const proteinScore = Math.max(0, 100 - Math.abs(totalProtein - targetProtein) / (targetProtein || 1) * 100);
    const carbsScore = Math.max(0, 100 - Math.abs(totalCarbs - targetCarbs) / (targetCarbs || 1) * 100);
    const fatScore = Math.max(0, 100 - Math.abs(totalFat - targetFat) / (targetFat || 1) * 100);
    
    const match_score = Math.round((calorieScore + proteinScore + carbsScore + fatScore) / 4);

    recommendations.push({
      meal_id: '',
      meal_name: criteria.meal_type || 'Suggested Meal',
      meal_type: criteria.meal_type || 'Snack',
      description: `A meal with approximately ${Math.round(totalCalories)} calories`,
      estimated_calories: totalCalories,
      estimated_protein: totalProtein,
      estimated_carbs: totalCarbs,
      estimated_fat: totalFat,
      preparation_time: 30,
      foods: recommended_foods,
      recommended_foods,
      benefits: [],
      match_score
    });

    return recommendations.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  }

  // Helper methods
  private static isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private static isValidTime(timeString: string): boolean {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeString);
  }
}