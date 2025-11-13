import { Request, Response } from 'express';
import RecommendationService from '../services/RecommendationService';
import OpenAIService from '../services/OpenAIService';
import { RecommendationRequest } from '../models/Recommendation';

export class RecommendationController {
  // Generate recommendations for user
  async generateRecommendations(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { type, count, context } = req.body as Partial<RecommendationRequest>;
      
      const request: RecommendationRequest = {
        userId,
        type,
        count: count || 5,
        context
      };

      const recommendations = await RecommendationService.generateRecommendations(request);
      
      res.json({
        success: true,
        data: recommendations,
        metadata: {
          totalCount: recommendations.length,
          aiGenerated: OpenAIService.isEnabled(),
          cacheHit: false
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate recommendations'
      });
    }
  }

  // Get user's existing recommendations
  async getUserRecommendations(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      
      let recommendations = await RecommendationService.getUserRecommendations(userId, limit);
      
      // Filter by type if specified
      if (type && (type === 'exercise' || type === 'food')) {
        recommendations = recommendations.filter(r => r.type === type);
      }
      
      res.json({
        success: true,
        data: recommendations,
        count: recommendations.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get recommendations'
      });
    }
  }

  // Update recommendation status (viewed, accepted, dismissed)
  async updateRecommendationStatus(req: Request, res: Response) {
    try {
      const { userId, recommendationId } = req.params;
      const { status } = req.body;
      
      if (!['viewed', 'accepted', 'dismissed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: viewed, accepted, dismissed'
        });
      }
      
      const updated = await RecommendationService.updateRecommendationStatus(
        userId, 
        recommendationId, 
        status
      );
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Recommendation not found'
        });
      }
      
      res.json({
        success: true,
        message: `Recommendation status updated to ${status}`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update recommendation status'
      });
    }
  }

  // Get exercise recommendations specifically
  async getExerciseRecommendations(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const count = parseInt(req.query.count as string) || 5;
      
      const request: RecommendationRequest = {
        userId,
        type: 'exercise',
        count
      };

      const recommendations = await RecommendationService.generateRecommendations(request);
      
      res.json({
        success: true,
        data: recommendations,
        metadata: {
          totalCount: recommendations.length,
          type: 'exercise',
          aiGenerated: OpenAIService.isEnabled()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get exercise recommendations'
      });
    }
  }

  // Get food recommendations specifically
  async getFoodRecommendations(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const count = parseInt(req.query.count as string) || 5;
      
      const request: RecommendationRequest = {
        userId,
        type: 'food',
        count
      };

      const recommendations = await RecommendationService.generateRecommendations(request);
      
      res.json({
        success: true,
        data: recommendations,
        metadata: {
          totalCount: recommendations.length,
          type: 'food',
          aiGenerated: OpenAIService.isEnabled()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get food recommendations'
      });
    }
  }

  // Quick recommendation endpoint (mixed exercise + food)
  async getQuickRecommendations(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      const request: RecommendationRequest = {
        userId,
        count: 6 // 3 exercise + 3 food
      };

      const recommendations = await RecommendationService.generateRecommendations(request);
      
      // Separate by type
      const exercises = recommendations.filter(r => r.type === 'exercise');
      const foods = recommendations.filter(r => r.type === 'food');
      
      res.json({
        success: true,
        data: {
          exercises: exercises.slice(0, 3),
          foods: foods.slice(0, 3),
          all: recommendations
        },
        metadata: {
          totalCount: recommendations.length,
          exerciseCount: exercises.length,
          foodCount: foods.length,
          aiGenerated: OpenAIService.isEnabled()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get quick recommendations'
      });
    }
  }
}

export default new RecommendationController();