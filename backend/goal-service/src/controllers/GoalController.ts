import { Request, Response } from 'express';
import { GoalService } from '../services/GoalService';
import { AuthRequest } from '../middleware/authenticate';
import {
  CreateGoalRequest,
  UpdateGoalRequest,
  AssignGoalRequest,
  UpdateUserGoalRequest,
  GoalFilters,
  GoalPagination,
  GoalApiResponse
} from '../models/Goal';

export class GoalController {
  private goalService: GoalService;

  constructor() {
    this.goalService = new GoalService();
  }

  // =================== Goal Management ===================

  createGoal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const goalData: CreateGoalRequest = req.body;
      
      const goal = await this.goalService.createGoal(goalData);
      
      const response: GoalApiResponse<typeof goal> = {
        success: true,
        data: goal,
        message: 'Goal created successfully',
        timestamp: new Date()
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating goal:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create goal',
        timestamp: new Date()
      };
      res.status(400).json(response);
    }
  };

  getGoals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const goals = await this.goalService.getAllGoals();
      
      const response: GoalApiResponse<typeof goals> = {
        success: true,
        data: goals,
        message: 'Goals retrieved successfully',
        timestamp: new Date()
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching goals:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch goals',
        timestamp: new Date()
      };
      res.status(400).json(response);
    }
  };

  getGoalById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { goalId } = req.params;
      
      const goal = await this.goalService.getGoalById(goalId);
      
      if (!goal) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'Goal not found',
          timestamp: new Date()
        };
        res.status(404).json(response);
        return;
      }

      const response: GoalApiResponse<typeof goal> = {
        success: true,
        data: goal,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting goal:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get goal',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  updateGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { goalId } = req.params;
      const updateData: UpdateGoalRequest = req.body;
      
      const goal = await this.goalService.updateGoal(goalId, updateData);
      
      if (!goal) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'Goal not found',
          timestamp: new Date()
        };
        res.status(404).json(response);
        return;
      }

      const response: GoalApiResponse<typeof goal> = {
        success: true,
        data: goal,
        message: 'Goal updated successfully',
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error updating goal:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update goal',
        timestamp: new Date()
      };
      res.status(400).json(response);
    }
  };

  deleteGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { goalId } = req.params;
      
      const deleted = await this.goalService.deleteGoal(goalId);
      
      if (!deleted) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'Goal not found',
          timestamp: new Date()
        };
        res.status(404).json(response);
        return;
      }

      const response: GoalApiResponse<null> = {
        success: true,
        message: 'Goal deleted successfully',
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error deleting goal:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to delete goal',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  getAllGoals = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: GoalFilters = {
        goal_type: req.query.goal_type as any,
        is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
        created_after: req.query.created_after ? new Date(req.query.created_after as string) : undefined,
        created_before: req.query.created_before ? new Date(req.query.created_before as string) : undefined
      };

      const pagination: GoalPagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sort_by: req.query.sort_by as any || 'created_at',
        sort_order: req.query.sort_order as any || 'DESC'
      };
      
      const goals = await this.goalService.getAllGoals(filters, pagination);
      
      const response: GoalApiResponse<typeof goals> = {
        success: true,
        data: goals,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting goals:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get goals',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  getPopularGoals = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const goals = await this.goalService.getPopularGoals(limit);
      
      const response: GoalApiResponse<typeof goals> = {
        success: true,
        data: goals,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting popular goals:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get popular goals',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  // =================== User Goal Management ===================

  assignGoalToUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'User ID not found in token',
          timestamp: new Date()
        };
        res.status(401).json(response);
        return;
      }

      const assignData: AssignGoalRequest = req.body;
      
      const userGoal = await this.goalService.assignGoalToUser(userId, assignData);
      
      const response: GoalApiResponse<typeof userGoal> = {
        success: true,
        data: userGoal,
        message: 'Goal assigned successfully',
        timestamp: new Date()
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Error assigning goal:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign goal',
        timestamp: new Date()
      };
      res.status(400).json(response);
    }
  };

  getUserGoals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'User ID not found in token',
          timestamp: new Date()
        };
        res.status(401).json(response);
        return;
      }

      const filters: GoalFilters = {
        status: req.query.status as any,
        goal_type: req.query.goal_type as any,
        completion_status: req.query.completion_status as any,
        progress_min: req.query.progress_min ? parseFloat(req.query.progress_min as string) : undefined,
        progress_max: req.query.progress_max ? parseFloat(req.query.progress_max as string) : undefined
      };

      const pagination: GoalPagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sort_by: req.query.sort_by as any || 'created_at',
        sort_order: req.query.sort_order as any || 'DESC'
      };
      
      const result = await this.goalService.getUserGoals(userId, filters, pagination);
      
      const response: GoalApiResponse<typeof result> = {
        success: true,
        data: result,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting user goals:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get user goals',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  getUserGoalById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userGoalId } = req.params;
      
      const userGoal = await this.goalService.getUserGoalById(userGoalId);
      
      if (!userGoal) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'User goal not found',
          timestamp: new Date()
        };
        res.status(404).json(response);
        return;
      }

      const response: GoalApiResponse<typeof userGoal> = {
        success: true,
        data: userGoal,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting user goal:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get user goal',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  updateUserGoal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userGoalId } = req.params;
      const updateData: UpdateUserGoalRequest = req.body;
      
      const userGoal = await this.goalService.updateUserGoal(userGoalId, updateData);
      
      if (!userGoal) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'User goal not found',
          timestamp: new Date()
        };
        res.status(404).json(response);
        return;
      }

      const response: GoalApiResponse<typeof userGoal> = {
        success: true,
        data: userGoal,
        message: 'User goal updated successfully',
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error updating user goal:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user goal',
        timestamp: new Date()
      };
      res.status(400).json(response);
    }
  };

  deleteUserGoal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userGoalId } = req.params;
      
      const deleted = await this.goalService.deleteUserGoal(userGoalId);
      
      if (!deleted) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'User goal not found',
          timestamp: new Date()
        };
        res.status(404).json(response);
        return;
      }

      const response: GoalApiResponse<null> = {
        success: true,
        message: 'User goal deleted successfully',
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error deleting user goal:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to delete user goal',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  // =================== Progress Tracking ===================

  getGoalProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userGoalId } = req.params;
      
      const progress = await this.goalService.getGoalProgress(userGoalId);
      
      if (!progress) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'Goal progress not found',
          timestamp: new Date()
        };
        res.status(404).json(response);
        return;
      }

      const response: GoalApiResponse<typeof progress> = {
        success: true,
        data: progress,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting goal progress:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get goal progress',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  updateGoalProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userGoalId } = req.params;
      const { progress_percentage } = req.body;
      
      if (progress_percentage === undefined) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'Progress percentage is required',
          timestamp: new Date()
        };
        res.status(400).json(response);
        return;
      }
      
      const userGoal = await this.goalService.updateGoalProgress(userGoalId, progress_percentage);
      
      if (!userGoal) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'User goal not found',
          timestamp: new Date()
        };
        res.status(404).json(response);
        return;
      }

      const response: GoalApiResponse<typeof userGoal> = {
        success: true,
        data: userGoal,
        message: 'Goal progress updated successfully',
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error updating goal progress:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update goal progress',
        timestamp: new Date()
      };
      res.status(400).json(response);
    }
  };

  getUserGoalStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'User ID not found in token',
          timestamp: new Date()
        };
        res.status(401).json(response);
        return;
      }
      
      const statistics = await this.goalService.getUserGoalStatistics(userId);
      
      const response: GoalApiResponse<typeof statistics> = {
        success: true,
        data: statistics,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting goal statistics:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get goal statistics',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  getActiveGoalsNearDeadline = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'User ID not found in token',
          timestamp: new Date()
        };
        res.status(401).json(response);
        return;
      }

      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      
      const goals = await this.goalService.getActiveGoalsNearDeadline(userId, days);
      
      const response: GoalApiResponse<typeof goals> = {
        success: true,
        data: goals,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting goals near deadline:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get goals near deadline',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  getRecentGoalActivity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'User ID not found in token',
          timestamp: new Date()
        };
        res.status(401).json(response);
        return;
      }

      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      
      const goals = await this.goalService.getRecentGoalActivity(userId, days);
      
      const response: GoalApiResponse<typeof goals> = {
        success: true,
        data: goals,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting recent goal activity:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get recent goal activity',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  // =================== Goal Recommendations ===================

  getGoalRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'User ID not found in token',
          timestamp: new Date()
        };
        res.status(401).json(response);
        return;
      }
      
      const recommendations = await this.goalService.getGoalRecommendations(userId);
      
      const response: GoalApiResponse<typeof recommendations> = {
        success: true,
        data: recommendations,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting goal recommendations:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get goal recommendations',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  getGoalAdjustmentSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userGoalId } = req.params;
      
      const suggestions = await this.goalService.getGoalAdjustmentSuggestions(userGoalId);
      
      const response: GoalApiResponse<typeof suggestions> = {
        success: true,
        data: suggestions,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting goal adjustment suggestions:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get goal adjustment suggestions',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  getGoalTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await this.goalService.getGoalTemplates();
      
      const response: GoalApiResponse<typeof templates> = {
        success: true,
        data: templates,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting goal templates:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get goal templates',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };

  createGoalFromTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { templateId } = req.params;
      const customizations = req.body.customizations;
      
      const goalData = await this.goalService.createGoalFromTemplate(templateId, customizations);
      const goal = await this.goalService.createGoal(goalData);
      
      const response: GoalApiResponse<typeof goal> = {
        success: true,
        data: goal,
        message: 'Goal created from template successfully',
        timestamp: new Date()
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating goal from template:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create goal from template',
        timestamp: new Date()
      };
      res.status(400).json(response);
    }
  };

  getSmartGoalSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        const response: GoalApiResponse<null> = {
          success: false,
          error: 'User ID not found in token',
          timestamp: new Date()
        };
        res.status(401).json(response);
        return;
      }
      
      const suggestions = await this.goalService.getSmartGoalSuggestions(userId);
      
      const response: GoalApiResponse<typeof suggestions> = {
        success: true,
        data: suggestions,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting smart goal suggestions:', error);
      const response: GoalApiResponse<null> = {
        success: false,
        error: 'Failed to get smart goal suggestions',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  };
}