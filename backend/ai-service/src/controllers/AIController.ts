import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { UserService } from '../services/UserService.js';
import { AIService } from '../services/AIService.js';
import { MessageService } from '../services/MessageService.js';
import logger from '../config/logger.js';

export class AIController {
  // Health check
  static async status(req: Request, res: Response) {
    try {
      const aiHealthy = await AIService.healthCheck();
      
      res.json({
        service: 'ai-service',
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        components: {
          ai: aiHealthy ? 'healthy' : 'unhealthy',
          rabbitmq: 'connected' // Could add actual check here
        },
        endpoints: [
          'GET /ai/status',
          'POST /ai/nutrition-advice',
          'POST /ai/ask-coach'
        ]
      });
    } catch (error: any) {
      logger.error('Status check failed', { error });
      res.status(500).json({
        service: 'ai-service',
        status: 'error',
        error: error.message
      });
    }
  }

  // Get nutrition advice based on user profile and goals
  static async getNutritionAdvice(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const { question } = req.body;
      const token = req.headers.authorization?.substring(7);

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authorization token required'
        });
      }

      logger.info('Processing nutrition advice request', { userId, hasQuestion: !!question });

      // Fetch user data from user-service
      const userData = await UserService.getUserData(userId, token);

      // Generate AI advice
      const aiResponse = await AIService.generateNutritionAdvice({
        user: userData.user,
        userGoals: userData.goals,
        question,
        context: 'nutrition_advice'
      });

      if (!aiResponse.success) {
        return res.status(500).json(aiResponse);
      }

      // Publish event to message queue
      await MessageService.publish('ai.advice_generated', {
        userId,
        timestamp: new Date().toISOString(),
        requestType: 'nutrition_advice',
        hasCustomQuestion: !!question
      }).catch(error => {
        logger.warn('Failed to publish advice event', { error });
      });

      res.json({
        success: true,
        message: 'Nutrition advice generated successfully',
        advice: aiResponse.advice,
        recommendations: aiResponse.recommendations,
        user: {
          name: userData.user.name,
          goals_count: userData.goals.length
        }
      });

    } catch (error: any) {
      logger.error('Failed to generate nutrition advice', { 
        error: error.message,
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate nutrition advice',
        error: error.message
      });
    }
  }

  // Ask the AI coach a specific question
  static async askCoach(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const { question } = req.body;

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Question is required'
        });
      }

      const token = req.headers.authorization?.substring(7);

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authorization token required'
        });
      }

      logger.info('Processing coach question', { userId, questionLength: question.length });

      // Fetch user data from user-service
      const userData = await UserService.getUserData(userId, token);

      // Generate AI advice with specific question
      const aiResponse = await AIService.generateNutritionAdvice({
        user: userData.user,
        userGoals: userData.goals,
        question: question.trim(),
        context: 'coach_question'
      });

      if (!aiResponse.success) {
        return res.status(500).json(aiResponse);
      }

      // Publish event to message queue
      await MessageService.publish('ai.coach_question_answered', {
        userId,
        question: question.trim(),
        timestamp: new Date().toISOString(),
        responseLength: aiResponse.advice?.length || 0
      }).catch(error => {
        logger.warn('Failed to publish coach question event', { error });
      });

      res.json({
        success: true,
        message: 'Coach question answered successfully',
        question: question.trim(),
        answer: aiResponse.advice,
        recommendations: aiResponse.recommendations,
        user: {
          name: userData.user.name
        }
      });

    } catch (error: any) {
      logger.error('Failed to answer coach question', { 
        error: error.message,
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to answer question',
        error: error.message
      });
    }
  }
}