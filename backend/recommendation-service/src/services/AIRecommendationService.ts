import { openai, OPENAI_CONFIG } from '../config/openai';
import { AIPromptData, RecommendationResponse } from '../models/types';
import logger from '../config/logger';

export class AIRecommendationService {

  private static createSystemPrompt(): string {
    return `You are FitFood AI, an expert nutritionist and fitness coach. Your role is to provide personalized, actionable recommendations based on user data.

CONTEXT:
- You help users achieve their health and fitness goals through nutrition and exercise
- Always consider user's current health status, dietary preferences, allergies, and goals
- Provide practical, safe, and evidence-based recommendations
- Be encouraging but realistic

OUTPUT FORMAT:
Respond with a JSON object containing:
{
  "type": "meal|exercise|nutrition|general",
  "title": "Brief descriptive title",
  "content": "Main recommendation content (2-3 paragraphs)",
  "confidence": 0.85,
  "reasoning": "Why this recommendation fits the user",
  "actionable_items": ["specific action 1", "specific action 2", "specific action 3"]
}

GUIDELINES:
- Keep recommendations practical and achievable
- Consider user's activity level and current habits
- Respect dietary preferences and allergies
- Align with user's fitness goals
- Include specific numbers when relevant (calories, portions, timing)
- Be encouraging and supportive`;
  }

  private static createUserPrompt(data: AIPromptData, recommendationType: string): string {
    const { user, goals, recent_meals, recent_exercises, context } = data;
    
    let prompt = `Please analyze this user's data and provide a ${recommendationType} recommendation:

USER PROFILE:
- Name: ${user.first_name || 'User'} ${user.last_name || ''}
- Age: ${user.age || 'Not specified'}
- Gender: ${user.gender || 'Not specified'}
- Height: ${user.height_cm ? `${user.height_cm}cm` : 'Not specified'}
- Weight: ${user.weight_kg ? `${user.weight_kg}kg` : 'Not specified'}
- Activity Level: ${user.activity_level || 'Not specified'}
- Subscription: ${user.subscription_type || 'free'}
- Dietary Preferences: ${user.dietary_preferences?.join(', ') || 'None specified'}
- Allergies: ${user.allergies?.join(', ') || 'None'}
- Health Conditions: ${user.health_conditions?.join(', ') || 'None'}

ACTIVE GOALS:
${goals.filter(g => g.is_active).map(goal => 
  `- ${goal.goal_type}: ${goal.description || 'No description'}
    Target: ${goal.target_calories ? `${goal.target_calories} cal` : ''} ${goal.target_protein ? `${goal.target_protein}g protein` : ''} ${goal.target_carbs ? `${goal.target_carbs}g carbs` : ''} ${goal.target_fat ? `${goal.target_fat}g fat` : ''}`
).join('\n')}

RECENT MEALS (Last 7 days):
${recent_meals.slice(0, 5).map(meal => 
  `- ${meal.meal_date} (${meal.meal_type}): ${meal.calorie_intake} calories
    Foods: ${meal.foods.map(f => `${f.food_name} (${f.quantity})`).join(', ')}`
).join('\n')}

RECENT EXERCISES (Last 7 days):
${recent_exercises.slice(0, 5).map(ex => 
  `- ${ex.exercise_date}: ${ex.exercise_name} - ${ex.duration_minutes}min, ${ex.calories_burned} cal burned (${ex.intensity} intensity)`
).join('\n')}`;

    if (context) {
      prompt += `\n\nADDITIONAL CONTEXT: ${context}`;
    }

    prompt += `\n\nBased on this information, provide a personalized ${recommendationType} recommendation that helps the user progress towards their goals while considering their current habits, preferences, and constraints.`;

    return prompt;
  }

  static async generateRecommendation(
    data: AIPromptData, 
    type: string = 'general'
  ): Promise<RecommendationResponse> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = this.createSystemPrompt();
      const userPrompt = this.createUserPrompt(data, type);

      logger.info(`Generating ${type} recommendation for user ${data.user.user_id}`);

      const completion = await openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        max_tokens: OPENAI_CONFIG.maxTokens,
        temperature: OPENAI_CONFIG.temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      });

      const responseContent = completion.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('No response from OpenAI');
      }

      let recommendation: RecommendationResponse;
      try {
        recommendation = JSON.parse(responseContent);
      } catch (parseError) {
        logger.error('Failed to parse OpenAI response:', parseError);
        throw new Error('Invalid response format from AI');
      }

      // Add timestamp
      recommendation.timestamp = new Date().toISOString();

      // Validate response structure
      if (!recommendation.type || !recommendation.title || !recommendation.content) {
        throw new Error('Incomplete recommendation response');
      }

      logger.info(`Successfully generated ${type} recommendation for user ${data.user.user_id}`);
      return recommendation;

    } catch (error) {
      logger.error('Error generating AI recommendation:', error);
      
      // Fallback recommendation
      return {
        type: type,
        title: 'Personalized Health Tip',
        content: 'Continue following your current routine and make small, sustainable changes to reach your goals. Stay hydrated, get adequate sleep, and listen to your body.',
        confidence: 0.5,
        reasoning: 'Fallback recommendation due to AI service unavailability',
        actionable_items: [
          'Track your daily water intake',
          'Aim for 7-9 hours of sleep',
          'Take a 10-minute walk after meals'
        ],
        timestamp: new Date().toISOString()
      };
    }
  }

  static async generateMealRecommendation(data: AIPromptData): Promise<RecommendationResponse> {
    return this.generateRecommendation(data, 'meal');
  }

  static async generateExerciseRecommendation(data: AIPromptData): Promise<RecommendationResponse> {
    return this.generateRecommendation(data, 'exercise');
  }

  static async generateNutritionRecommendation(data: AIPromptData): Promise<RecommendationResponse> {
    return this.generateRecommendation(data, 'nutrition');
  }
}