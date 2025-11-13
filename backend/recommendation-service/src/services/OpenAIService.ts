// Placeholder for OpenAI integration
// This will be implemented when you add your OpenAI API key

import OpenAI from 'openai';
import { AIContext, Recommendation, RecommendationType } from '../models/Recommendation';

export class OpenAIService {
  private openai: OpenAI | null = null;
  private enabled: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      this.enabled = true;
      console.log('OpenAI service initialized successfully');
    } else {
      console.log('OpenAI service disabled - no valid API key provided');
    }
  }

  async generateRecommendations(
    context: AIContext, 
    type?: RecommendationType, 
    count: number = 5
  ): Promise<Recommendation[]> {
    if (!this.enabled || !this.openai) {
      throw new Error('OpenAI service is not enabled');
    }

    try {
      const prompt = this.buildPrompt(context, type, count);
      
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional fitness and nutrition AI assistant. Provide personalized recommendations based on user data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return this.parseRecommendations(content, context.user.id, type);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  private buildPrompt(context: AIContext, type?: RecommendationType, count: number = 5): string {
    const { user, currentGoals, preferences, timeOfDay, recentBehaviors } = context;
    
    let prompt = `Generate ${count} personalized ${type || 'exercise and food'} recommendations for this user:

User Profile:
- Age: ${user.age}, Gender: ${user.gender}
- Height: ${user.height}cm, Weight: ${user.weight}kg
- Activity Level: ${user.activityLevel}
- Current time: ${timeOfDay}

Fitness Goals:
${currentGoals.map(goal => `- ${goal.type}: ${goal.current}/${goal.target} ${goal.unit}`).join('\n')}

Preferences:
- Exercise types: ${preferences.exerciseTypes.join(', ')}
- Exercise duration: ${preferences.exerciseDuration} minutes
- Exercise frequency: ${preferences.exerciseFrequency} times/week
- Cuisine preferences: ${preferences.cuisinePreferences.join(', ')}
- Cooking time: max ${preferences.cookingTime} minutes
- Budget: ${preferences.budgetRange}

Dietary Restrictions: ${user.dietaryRestrictions.join(', ') || 'None'}
Allergies: ${user.allergies.join(', ') || 'None'}

Recent Behavior Patterns:
${recentBehaviors.slice(0, 5).map(b => `- ${b.type}: ${b.action}`).join('\n')}

Please provide recommendations in JSON format with the following structure:
{
  "recommendations": [
    {
      "type": "exercise" | "food",
      "title": "...",
      "description": "...",
      "reasoning": "why this is recommended",
      "confidence": 0.8,
      "content": {
        // For exercise: name, type, duration, intensity, equipment, instructions, benefits, caloriesBurned, difficulty
        // For food: name, mealType, cuisine, ingredients, instructions, nutrition, prepTime, cookTime, servings, difficulty
      }
    }
  ]
}`;

    return prompt;
  }

  private parseRecommendations(content: string, userId: string, type?: RecommendationType): Recommendation[] {
    try {
      const parsed = JSON.parse(content);
      const recommendations = parsed.recommendations || [];
      
      return recommendations.map((rec: any) => ({
        id: this.generateId(),
        userId,
        type: rec.type,
        category: rec.content.type || rec.content.mealType || 'general',
        title: rec.title,
        description: rec.description,
        content: rec.content,
        confidence: rec.confidence || 0.7,
        reasoning: rec.reasoning,
        tags: this.extractTags(rec),
        createdAt: new Date().toISOString(),
        status: 'pending'
      }));
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      return [];
    }
  }

  private extractTags(recommendation: any): string[] {
    const tags: string[] = [];
    
    if (recommendation.content) {
      if (recommendation.content.type) tags.push(recommendation.content.type);
      if (recommendation.content.difficulty) tags.push(recommendation.content.difficulty);
      if (recommendation.content.intensity) tags.push(recommendation.content.intensity);
      if (recommendation.content.mealType) tags.push(recommendation.content.mealType);
      if (recommendation.content.cuisine) tags.push(recommendation.content.cuisine);
    }
    
    return tags;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export default new OpenAIService();