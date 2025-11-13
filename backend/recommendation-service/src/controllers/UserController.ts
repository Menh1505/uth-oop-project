import { Request, Response } from 'express';
import RecommendationService from '../services/RecommendationService';
import { User } from '../models/Recommendation';

export class UserController {
  // Create new user
  async createUser(req: Request, res: Response) {
    try {
      const userData = req.body;
      const user = await RecommendationService.createUser(userData);
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create user'
      });
    }
  }

  // Get user by ID
  async getUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const user = await RecommendationService.getUser(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user'
      });
    }
  }

  // Update user
  async updateUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      const user = await RecommendationService.updateUser(userId, updates);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update user'
      });
    }
  }

  // Delete user
  async deleteUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const deleted = await RecommendationService.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  }

  // List all users
  async listUsers(req: Request, res: Response) {
    try {
      const users = await RecommendationService.listUsers();
      res.json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to list users'
      });
    }
  }

  // Get user behaviors
  async getUserBehaviors(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const behaviors = await RecommendationService.getUserBehaviors(userId, limit);
      
      res.json({
        success: true,
        data: behaviors,
        count: behaviors.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user behaviors'
      });
    }
  }

  // Track user behavior
  async trackBehavior(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { type, action, metadata } = req.body;
      
      const behavior = await RecommendationService.trackBehavior(userId, type, action, metadata);
      
      res.status(201).json({
        success: true,
        data: behavior,
        message: 'Behavior tracked successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to track behavior'
      });
    }
  }
}

export default new UserController();