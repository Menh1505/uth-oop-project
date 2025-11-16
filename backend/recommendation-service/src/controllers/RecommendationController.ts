import { Request, Response } from 'express';
import { UserDataService } from '../services/UserDataService';
import { AIRecommendationService } from '../services/AIRecommendationService';
import { RecommendationRequest } from '../models/types';
import logger from '../config/logger';
import pool from '../config/database';

export class RecommendationController {
  
  static async getRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, type = 'general', context } = req.body as RecommendationRequest;
      
      if (!user_id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      logger.info(`Generating ${type} recommendation for user ${user_id}`);

      // Fetch all user data
      const userData = await UserDataService.getAllUserData(user_id);
      
      // Add context if provided
      const promptData = {
        ...userData,
        context
      };

      // Generate AI recommendation based on type
      let recommendation;
      switch (type) {
        case 'meal':
          recommendation = await AIRecommendationService.generateMealRecommendation(promptData);
          break;
        case 'exercise':
          recommendation = await AIRecommendationService.generateExerciseRecommendation(promptData);
          break;
        case 'nutrition':
          recommendation = await AIRecommendationService.generateNutritionRecommendation(promptData);
          break;
        default:
          recommendation = await AIRecommendationService.generateRecommendation(promptData, type);
      }

      // Save recommendation to database
      await RecommendationController.saveRecommendation(user_id, recommendation);

      res.json({
        success: true,
        recommendation
      });

    } catch (error) {
      logger.error('Error generating recommendation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate recommendation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getRecommendationHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      let query = `
        SELECT 
          recommendation_id,
          type,
          title,
          content,
          confidence,
          created_at
        FROM recommendations 
        WHERE user_id = $1
      `;
      const params: any[] = [userId];

      if (type) {
        query += ' AND type = $2';
        params.push(type);
        query += ' ORDER BY created_at DESC LIMIT $3';
        params.push(limit);
      } else {
        query += ' ORDER BY created_at DESC LIMIT $2';
        params.push(limit);
      }

      const result = await pool.query(query, params);

      res.json({
        success: true,
        recommendations: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      logger.error('Error fetching recommendation history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recommendation history'
      });
    }
  }

  static async getDailyRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      // Check if user already has a recommendation for today
      const todayQuery = `
        SELECT * FROM recommendations 
        WHERE user_id = $1 
          AND DATE(created_at) = CURRENT_DATE 
          AND type = 'general'
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const existingRec = await pool.query(todayQuery, [userId]);
      
      if (existingRec.rows.length > 0) {
        res.json({
          success: true,
          recommendation: existingRec.rows[0],
          isNew: false
        });
        return;
      }

      // Generate new daily recommendation
      const userData = await UserDataService.getAllUserData(userId);
      
      const recommendation = await AIRecommendationService.generateRecommendation(
        userData, 
        'general'
      );

      await RecommendationController.saveRecommendation(userId, recommendation);

      res.json({
        success: true,
        recommendation,
        isNew: true
      });

    } catch (error) {
      logger.error('Error generating daily recommendation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate daily recommendation'
      });
    }
  }

  private static async saveRecommendation(userId: number, recommendation: any) {
    try {
      const query = `
        INSERT INTO recommendations (
          user_id, type, title, content, 
          confidence, reasoning, actionable_items
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING recommendation_id
      `;
      
      const values = [
        userId,
        recommendation.type,
        recommendation.title,
        recommendation.content,
        recommendation.confidence,
        recommendation.reasoning,
        JSON.stringify(recommendation.actionable_items || [])
      ];

      const result = await pool.query(query, values);
      logger.info(`Saved recommendation ${result.rows[0].recommendation_id} for user ${userId}`);
      
    } catch (error) {
      logger.error('Error saving recommendation:', error);
      // Don't throw error, just log it - recommendation should still be returned
    }
  }

  // Health check endpoint
  static async health(req: Request, res: Response): Promise<void> {
    try {
      // Test database connection
      await pool.query('SELECT 1');
      
      res.json({
        status: 'OK',
        service: 'recommendation-service',
        timestamp: new Date().toISOString(),
        database: 'connected',
        ai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
      });
    } catch (error) {
      res.status(503).json({
        status: 'Error',
        service: 'recommendation-service',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}