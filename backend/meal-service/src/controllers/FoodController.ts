import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { FoodService } from '../services/FoodService';

export class FoodController {
  // Create new food
  static async createFood(req: AuthRequest, res: Response) {
    try {
      const foodData = req.body;
      const food = await FoodService.createFood(foodData);
      
      res.status(201).json({
        success: true,
        message: 'Food created successfully',
        food
      });
    } catch (error: any) {
      console.error('Create food error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create food',
        error: error.message
      });
    }
  }

  // Get food by ID
  static async getFood(req: AuthRequest, res: Response) {
    try {
      const { foodId } = req.params;
      const food = await FoodService.getFoodById(foodId);
      
      if (!food) {
        return res.status(404).json({
          success: false,
          message: 'Food not found'
        });
      }

      res.json({
        success: true,
        food
      });
    } catch (error: any) {
      console.error('Get food error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch food',
        error: error.message
      });
    }
  }

  // Search foods
  static async searchFoods(req: AuthRequest, res: Response) {
    try {
      const {
        search_term,
        category,
        is_vegetarian,
        is_vegan,
        is_gluten_free,
        max_calories,
        min_protein,
        exclude_allergens,
        limit = '50',
        offset = '0'
      } = req.query;

      const filters = {
        search_term: search_term as string,
        category: category as string,
        is_vegetarian: is_vegetarian === 'true',
        is_vegan: is_vegan === 'true',
        is_gluten_free: is_gluten_free === 'true',
        max_calories: max_calories ? parseInt(max_calories as string) : undefined,
        min_protein: min_protein ? parseFloat(min_protein as string) : undefined,
        exclude_allergens: exclude_allergens ? 
          (exclude_allergens as string).split(',').map(a => a.trim()) : undefined
      };

      // Clean up filters - remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const foods = await FoodService.searchFoods(
        filters, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      
      res.json({
        success: true,
        foods,
        count: foods.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
    } catch (error: any) {
      console.error('Search foods error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to search foods',
        error: error.message
      });
    }
  }

  // Get foods by category
  static async getFoodsByCategory(req: AuthRequest, res: Response) {
    try {
      const { category } = req.params;
      const foods = await FoodService.getFoodsByCategory(category);
      
      res.json({
        success: true,
        category,
        foods,
        count: foods.length
      });
    } catch (error: any) {
      console.error('Get foods by category error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch foods by category',
        error: error.message
      });
    }
  }

  // Get all food categories
  static async getFoodCategories(req: AuthRequest, res: Response) {
    try {
      const categories = await FoodService.getFoodCategories();
      
      res.json({
        success: true,
        categories,
        count: categories.length
      });
    } catch (error: any) {
      console.error('Get food categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch food categories',
        error: error.message
      });
    }
  }

  // Update food
  static async updateFood(req: AuthRequest, res: Response) {
    try {
      const { foodId } = req.params;
      const updateData = req.body;
      
      const food = await FoodService.updateFood(foodId, updateData);
      
      res.json({
        success: true,
        message: 'Food updated successfully',
        food
      });
    } catch (error: any) {
      console.error('Update food error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update food',
        error: error.message
      });
    }
  }

  // Delete food
  static async deleteFood(req: AuthRequest, res: Response) {
    try {
      const { foodId } = req.params;
      await FoodService.deleteFood(foodId);
      
      res.json({
        success: true,
        message: 'Food deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete food error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete food',
        error: error.message
      });
    }
  }

  // Find food by barcode
  static async findFoodByBarcode(req: AuthRequest, res: Response) {
    try {
      const { barcode } = req.params;
      const food = await FoodService.findFoodByBarcode(barcode);
      
      if (!food) {
        return res.status(404).json({
          success: false,
          message: 'Food not found with this barcode'
        });
      }

      res.json({
        success: true,
        food
      });
    } catch (error: any) {
      console.error('Find food by barcode error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to find food by barcode',
        error: error.message
      });
    }
  }

  // Get popular foods
  static async getPopularFoods(req: AuthRequest, res: Response) {
    try {
      const { limit = '20' } = req.query;
      const foods = await FoodService.getPopularFoods(parseInt(limit as string));
      
      res.json({
        success: true,
        foods,
        count: foods.length
      });
    } catch (error: any) {
      console.error('Get popular foods error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch popular foods',
        error: error.message
      });
    }
  }

  // Get recent foods
  static async getRecentFoods(req: AuthRequest, res: Response) {
    try {
      const { limit = '20' } = req.query;
      const foods = await FoodService.getRecentFoods(parseInt(limit as string));
      
      res.json({
        success: true,
        foods,
        count: foods.length
      });
    } catch (error: any) {
      console.error('Get recent foods error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch recent foods',
        error: error.message
      });
    }
  }

  // Calculate nutrition for custom quantity
  static async calculateNutrition(req: AuthRequest, res: Response) {
    try {
      const { foodId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
      }

      const food = await FoodService.getFoodById(foodId);
      if (!food) {
        return res.status(404).json({
          success: false,
          message: 'Food not found'
        });
      }

      const nutrition = FoodService.calculateNutritionForQuantity(food, quantity);
      
      res.json({
        success: true,
        food,
        quantity,
        nutrition
      });
    } catch (error: any) {
      console.error('Calculate nutrition error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to calculate nutrition',
        error: error.message
      });
    }
  }

  // Compare nutrition between multiple foods
  static async compareNutrition(req: AuthRequest, res: Response) {
    try {
      const { foods } = req.body; // Array of { food_id, quantity }

      if (!foods || !Array.isArray(foods) || foods.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Foods array is required'
        });
      }

      // Validate and fetch food details
      const foodsWithDetails = [];
      for (const item of foods) {
        if (!item.food_id || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Each food must have valid food_id and quantity'
          });
        }

        const food = await FoodService.getFoodById(item.food_id);
        if (!food) {
          return res.status(404).json({
            success: false,
            message: `Food not found: ${item.food_id}`
          });
        }

        foodsWithDetails.push({
          food,
          quantity: item.quantity
        });
      }

      const comparison = FoodService.compareNutrition(foodsWithDetails);
      
      res.json({
        success: true,
        comparison
      });
    } catch (error: any) {
      console.error('Compare nutrition error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to compare nutrition',
        error: error.message
      });
    }
  }
}