import { v4 as uuidv4 } from 'uuid';
import { 
  User, UserBehavior, Recommendation, RecommendationType, 
  AIContext, ExerciseRecommendation, FoodRecommendation,
  BehaviorType, RecommendationRequest 
} from '../models/Recommendation';

export class RecommendationService {
  private users: Map<string, User> = new Map();
  private behaviors: Map<string, UserBehavior[]> = new Map();
  private recommendations: Map<string, Recommendation[]> = new Map();
  private aiEnabled: boolean;

  constructor() {
    this.aiEnabled = process.env.ENABLE_AI_RECOMMENDATIONS === 'true';
    console.log(`RecommendationService initialized with AI ${this.aiEnabled ? 'enabled' : 'disabled'}`);
  }

  // User Management
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      id: uuidv4(),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(user.id, user);
    this.behaviors.set(user.id, []);
    this.recommendations.set(user.id, []);
    return user;
  }

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const deleted = this.users.delete(userId);
    if (deleted) {
      this.behaviors.delete(userId);
      this.recommendations.delete(userId);
    }
    return deleted;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Behavior Tracking
  async trackBehavior(userId: string, type: BehaviorType, action: string, metadata?: Record<string, any>): Promise<UserBehavior> {
    const behavior: UserBehavior = {
      id: uuidv4(),
      userId,
      type,
      action,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };

    const userBehaviors = this.behaviors.get(userId) || [];
    userBehaviors.push(behavior);
    this.behaviors.set(userId, userBehaviors);

    // Keep only last 100 behaviors per user
    if (userBehaviors.length > 100) {
      userBehaviors.splice(0, userBehaviors.length - 100);
    }

    return behavior;
  }

  async getUserBehaviors(userId: string, limit: number = 50): Promise<UserBehavior[]> {
    const behaviors = this.behaviors.get(userId) || [];
    return behaviors.slice(-limit).reverse(); // Most recent first
  }

  // Core Recommendation Logic
  async generateRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    const user = await this.getUser(request.userId);
    if (!user) throw new Error('User not found');

    const context = await this.buildAIContext(user);
    const count = request.count || 5;

    let recommendations: Recommendation[] = [];

    if (this.aiEnabled && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      // Use OpenAI API when available
      recommendations = await this.generateAIRecommendations(context, request.type, count);
    } else {
      // Use fallback rule-based recommendations
      recommendations = await this.generateFallbackRecommendations(context, request.type, count);
    }

    // Store recommendations
    const userRecommendations = this.recommendations.get(request.userId) || [];
    userRecommendations.push(...recommendations);
    this.recommendations.set(request.userId, userRecommendations);

    return recommendations;
  }

  private async buildAIContext(user: User): Promise<AIContext> {
    const recentBehaviors = await this.getUserBehaviors(user.id, 20);
    const now = new Date();
    
    return {
      user,
      recentBehaviors,
      currentGoals: user.fitnessGoals.filter(g => g.status === 'active'),
      preferences: user.preferences,
      timeOfDay: this.getTimeOfDay(now),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      season: this.getSeason(now)
    };
  }

  private async generateAIRecommendations(context: AIContext, type?: RecommendationType, count: number = 5): Promise<Recommendation[]> {
    // TODO: Implement OpenAI API integration
    // This is a placeholder that will be replaced with actual OpenAI calls
    console.log('AI recommendations requested but OpenAI integration not yet implemented');
    return this.generateFallbackRecommendations(context, type, count);
  }

  private async generateFallbackRecommendations(context: AIContext, type?: RecommendationType, count: number = 5): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const { user, currentGoals, preferences, timeOfDay } = context;

    // Generate exercise recommendations
    if (!type || type === 'exercise') {
      const exerciseRecs = this.generateExerciseRecommendations(user, currentGoals, preferences, timeOfDay);
      recommendations.push(...exerciseRecs.slice(0, Math.ceil(count / 2)));
    }

    // Generate food recommendations
    if (!type || type === 'food') {
      const foodRecs = this.generateFoodRecommendations(user, currentGoals, preferences, timeOfDay);
      recommendations.push(...foodRecs.slice(0, Math.floor(count / 2)));
    }

    return recommendations.slice(0, count);
  }

  private generateExerciseRecommendations(user: User, goals: any[], preferences: any, timeOfDay: string): Recommendation[] {
    const exercises = this.getExerciseDatabase();
    const recommendations: Recommendation[] = [];

    // Filter exercises based on user preferences and goals
    const suitableExercises = exercises.filter(exercise => {
      // Check if exercise type matches preferences
      if (preferences.exerciseTypes.length > 0 && 
          !preferences.exerciseTypes.includes(exercise.type)) {
        return false;
      }
      
      // Check duration preference
      if (exercise.duration > preferences.exerciseDuration + 10) {
        return false;
      }

      return true;
    });

    // Score and rank exercises
    suitableExercises.forEach(exercise => {
      let confidence = 0.5; // Base confidence
      let reasoning = `Recommended based on your preferences for ${exercise.type} exercises`;

      // Boost confidence based on goals
      goals.forEach(goal => {
        if (goal.type === 'weight_loss' && exercise.caloriesBurned > 200) {
          confidence += 0.2;
          reasoning += `, helps with weight loss (burns ${exercise.caloriesBurned} calories)`;
        }
        if (goal.type === 'strength' && exercise.type === 'strength') {
          confidence += 0.3;
          reasoning += `, builds strength`;
        }
        if (goal.type === 'endurance' && exercise.type === 'cardio') {
          confidence += 0.3;
          reasoning += `, improves endurance`;
        }
      });

      // Time-based adjustments
      if (timeOfDay === 'morning' && exercise.intensity === 'high') {
        confidence += 0.1;
        reasoning += `, high-intensity exercises are great for morning energy`;
      }
      if (timeOfDay === 'evening' && exercise.intensity === 'low') {
        confidence += 0.1;
        reasoning += `, gentle exercises perfect for evening`;
      }

      recommendations.push({
        id: uuidv4(),
        userId: user.id,
        type: 'exercise',
        category: exercise.type,
        title: exercise.name,
        description: `${exercise.duration}-minute ${exercise.type} workout`,
        content: exercise,
        confidence: Math.min(confidence, 1.0),
        reasoning,
        tags: [exercise.type, exercise.difficulty, exercise.intensity],
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    });

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private generateFoodRecommendations(user: User, goals: any[], preferences: any, timeOfDay: string): Recommendation[] {
    const foods = this.getFoodDatabase();
    const recommendations: Recommendation[] = [];

    // Determine meal type based on time of day
    let mealType = 'snack';
    if (timeOfDay === 'morning') mealType = 'breakfast';
    else if (timeOfDay === 'afternoon') mealType = 'lunch';
    else if (timeOfDay === 'evening') mealType = 'dinner';

    // Filter foods based on preferences and restrictions
    const suitableFoods = foods.filter(food => {
      // Check meal type
      if (food.mealType !== mealType && food.type !== 'snack') {
        return false;
      }

      // Check dietary restrictions
      if (user.dietaryRestrictions.some(restriction => 
          food.ingredients.some(ingredient => 
            ingredient.toLowerCase().includes(restriction.toLowerCase())))) {
        return false;
      }

      // Check allergies
      if (user.allergies.some(allergy => 
          food.ingredients.some(ingredient => 
            ingredient.toLowerCase().includes(allergy.toLowerCase())))) {
        return false;
      }

      // Check cooking time preference
      if (food.prepTime + food.cookTime > preferences.cookingTime) {
        return false;
      }

      return true;
    });

    // Score and rank foods
    suitableFoods.forEach(food => {
      let confidence = 0.5;
      let reasoning = `${food.mealType} recommendation based on your preferences`;

      // Goal-based scoring
      goals.forEach(goal => {
        if (goal.type === 'weight_loss' && food.nutrition.calories < 400) {
          confidence += 0.2;
          reasoning += `, low calorie for weight loss`;
        }
        if (goal.type === 'muscle_gain' && food.nutrition.protein > 20) {
          confidence += 0.3;
          reasoning += `, high protein for muscle building`;
        }
        if (goal.type === 'endurance' && food.nutrition.carbs > 30) {
          confidence += 0.2;
          reasoning += `, good carbs for energy`;
        }
      });

      // Cuisine preference
      if (preferences.cuisinePreferences.includes(food.cuisine)) {
        confidence += 0.2;
        reasoning += `, matches your ${food.cuisine} cuisine preference`;
      }

      recommendations.push({
        id: uuidv4(),
        userId: user.id,
        type: 'food',
        category: food.mealType,
        title: food.name,
        description: `${food.nutrition.calories} cal | ${food.prepTime + food.cookTime} min`,
        content: food,
        confidence: Math.min(confidence, 1.0),
        reasoning,
        tags: [food.mealType, food.cuisine, food.difficulty],
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    });

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  // Get user's recommendations
  async getUserRecommendations(userId: string, limit: number = 20): Promise<Recommendation[]> {
    const recommendations = this.recommendations.get(userId) || [];
    return recommendations.slice(-limit).reverse();
  }

  // Update recommendation status
  async updateRecommendationStatus(userId: string, recommendationId: string, status: 'viewed' | 'accepted' | 'dismissed'): Promise<boolean> {
    const recommendations = this.recommendations.get(userId) || [];
    const recommendation = recommendations.find(r => r.id === recommendationId);
    
    if (!recommendation) return false;
    
    recommendation.status = status;
    
    // Track this as behavior
    await this.trackBehavior(userId, 'recommendation_clicked', status, {
      recommendationId,
      recommendationType: recommendation.type,
      category: recommendation.category
    });
    
    return true;
  }

  // Utility methods
  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  // Sample data - in production these would come from databases
  private getExerciseDatabase(): ExerciseRecommendation[] {
    return [
      {
        name: 'Morning Cardio Run',
        type: 'cardio',
        duration: 30,
        intensity: 'medium',
        equipment: ['running_shoes'],
        instructions: [
          'Warm up with 5 minutes walking',
          'Run at moderate pace for 20 minutes',
          'Cool down with 5 minutes walking'
        ],
        benefits: ['cardiovascular health', 'weight loss', 'endurance'],
        caloriesBurned: 300,
        difficulty: 'intermediate'
      },
      {
        name: 'Bodyweight Strength Training',
        type: 'strength',
        duration: 25,
        intensity: 'high',
        equipment: [],
        instructions: [
          '3 sets of 10 push-ups',
          '3 sets of 15 squats',
          '3 sets of 30-second planks',
          '3 sets of 10 lunges each leg'
        ],
        benefits: ['muscle building', 'strength', 'metabolism boost'],
        caloriesBurned: 200,
        difficulty: 'beginner'
      },
      {
        name: 'Evening Yoga Flow',
        type: 'flexibility',
        duration: 20,
        intensity: 'low',
        equipment: ['yoga_mat'],
        instructions: [
          'Start with deep breathing',
          'Sun salutation sequence',
          'Hold various poses for 30 seconds each',
          'End with relaxation pose'
        ],
        benefits: ['flexibility', 'stress relief', 'balance'],
        caloriesBurned: 80,
        difficulty: 'beginner'
      }
    ];
  }

  private getFoodDatabase(): FoodRecommendation[] {
    return [
      {
        name: 'Protein Smoothie Bowl',
        type: 'meal',
        mealType: 'breakfast',
        cuisine: 'healthy',
        ingredients: ['banana', 'protein_powder', 'almond_milk', 'berries', 'granola'],
        instructions: [
          'Blend banana, protein powder, and almond milk',
          'Pour into bowl',
          'Top with berries and granola'
        ],
        nutrition: {
          calories: 350,
          protein: 25,
          carbs: 40,
          fat: 8,
          fiber: 6,
          sugar: 20,
          sodium: 200
        },
        prepTime: 5,
        cookTime: 0,
        servings: 1,
        difficulty: 'easy'
      },
      {
        name: 'Grilled Chicken Salad',
        type: 'meal',
        mealType: 'lunch',
        cuisine: 'mediterranean',
        ingredients: ['chicken_breast', 'mixed_greens', 'tomatoes', 'cucumber', 'olive_oil', 'lemon'],
        instructions: [
          'Season and grill chicken breast',
          'Prepare salad with mixed greens and vegetables',
          'Slice chicken and place on salad',
          'Drizzle with olive oil and lemon dressing'
        ],
        nutrition: {
          calories: 400,
          protein: 35,
          carbs: 15,
          fat: 20,
          fiber: 5,
          sugar: 8,
          sodium: 300
        },
        prepTime: 10,
        cookTime: 15,
        servings: 1,
        difficulty: 'medium'
      },
      {
        name: 'Vietnamese Pho Ga',
        type: 'meal',
        mealType: 'dinner',
        cuisine: 'vietnamese',
        ingredients: ['chicken_broth', 'rice_noodles', 'chicken', 'herbs', 'bean_sprouts', 'lime'],
        instructions: [
          'Heat chicken broth',
          'Cook rice noodles separately',
          'Prepare fresh herbs and vegetables',
          'Assemble bowl with noodles, chicken, and broth',
          'Garnish with herbs and serve with lime'
        ],
        nutrition: {
          calories: 450,
          protein: 30,
          carbs: 55,
          fat: 8,
          fiber: 3,
          sugar: 5,
          sodium: 800
        },
        prepTime: 15,
        cookTime: 20,
        servings: 1,
        difficulty: 'medium'
      }
    ];
  }
}

export default new RecommendationService();