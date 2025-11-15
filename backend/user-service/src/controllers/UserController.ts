import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { UserService } from '../services/UserService';

export class NewUserController {
  // Health check
  static async status(_req: AuthRequest, res: Response) {
    res.json({
      service: 'user-service',
      status: 'healthy',
      version: '2.0.0',
      database: process.env.DB_NAME || 'user_db',
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /users/register',
        'POST /users/login', 
        'GET /users/me',
        'PUT /users/me',
        'POST /users/onboarding',
        'GET /users/goals',
        'GET /users/goals/available',
        'POST /users/goals',
        'PUT /users/goals/:goalId',
        'DELETE /users/goals/:goalId',
        'GET /users/dashboard',
        'PUT /users/avatar'
      ]
    });
  }

  // Register new user
  static async register(req: AuthRequest, res: Response) {
    try {
      const userData = req.body;
      const newUser = await UserService.registerUser(userData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: newUser
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
        error: error.message
      });
    }
  }

  // User login
  static async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const user = await UserService.loginUser({ email, password });
      const needsOnboarding = await UserService.needsOnboarding(user.user_id);

      res.json({
        success: true,
        message: 'Login successful',
        user,
        needsOnboarding
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
        error: error.message
      });
    }
  }

  // Get current user profile
  static async getMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const user = await UserService.getUserProfile(userId);
      const needsOnboarding = await UserService.needsOnboarding(userId);

      res.json({
        success: true,
        user,
        needsOnboarding
      });
    } catch (error: any) {
      console.error('getMe error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message || 'Unknown error'
      });
    }
  }

  // Update user profile
  static async updateMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const updateData = req.body;
      const updatedUser = await UserService.updateUserProfile(userId, updateData);
      const needsOnboarding = await UserService.needsOnboarding(userId);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
        needsOnboarding
      });
    } catch (error: any) {
      console.error('updateMe error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile',
        error: error.message
      });
    }
  }

  // Complete onboarding
  static async completeOnboarding(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const onboardingData = req.body;
      const updatedUser = await UserService.completeOnboarding(userId, onboardingData);

      res.json({
        success: true,
        message: 'Onboarding completed successfully',
        user: updatedUser,
        needsOnboarding: false
      });
    } catch (error: any) {
      console.error('Onboarding error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to complete onboarding',
        error: error.message
      });
    }
  }

  // Get available goals
  static async getAvailableGoals(req: AuthRequest, res: Response) {
    try {
      const goals = await UserService.getAvailableGoals();
      res.json({
        success: true,
        goals
      });
    } catch (error: any) {
      console.error('Get available goals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available goals',
        error: error.message
      });
    }
  }

  // Get user's goals
  static async getUserGoals(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const goals = await UserService.getUserGoals(userId);
      const activeGoals = await UserService.getUserActiveGoals(userId);

      res.json({
        success: true,
        goals,
        activeGoals,
        totalGoals: goals.length,
        totalActiveGoals: activeGoals.length
      });
    } catch (error: any) {
      console.error('Get user goals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user goals',
        error: error.message
      });
    }
  }

  // Assign goal to user
  static async assignGoal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const assignData = req.body;
      const userGoal = await UserService.assignGoalToUser(userId, assignData);

      res.status(201).json({
        success: true,
        message: 'Goal assigned successfully',
        userGoal
      });
    } catch (error: any) {
      console.error('Assign goal error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to assign goal',
        error: error.message
      });
    }
  }

  // Update user goal progress
  static async updateGoalProgress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const userGoalId = req.params.goalId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const updateData = req.body;
      const updatedGoal = await UserService.updateUserGoalProgress(userId, userGoalId, updateData);

      res.json({
        success: true,
        message: 'Goal progress updated successfully',
        userGoal: updatedGoal
      });
    } catch (error: any) {
      console.error('Update goal progress error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update goal progress',
        error: error.message
      });
    }
  }

  // Remove user goal
  static async removeGoal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const userGoalId = req.params.goalId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      await UserService.removeUserGoal(userId, userGoalId);

      res.json({
        success: true,
        message: 'Goal removed successfully'
      });
    } catch (error: any) {
      console.error('Remove goal error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove goal',
        error: error.message
      });
    }
  }

  // Get user dashboard data
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const dashboardData = await UserService.getUserDashboard(userId);

      res.json({
        success: true,
        ...dashboardData
      });
    } catch (error: any) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
    }
  }

  // Upload avatar
  static async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      // Get base64 avatar from request body
      let avatarBase64: string | null = null;

      if ((req as any).body && typeof (req as any).body === 'string') {
        avatarBase64 = (req as any).body;
      }

      const avatarField = (req as any).body?.avatar || (req as any).body?.profile_picture_url;
      if (avatarField) {
        avatarBase64 = avatarField;
      }

      if (!avatarBase64) {
        return res.status(400).json({ 
          success: false,
          message: 'No avatar data provided' 
        });
      }

      // Basic validation
      if (typeof avatarBase64 !== 'string' || !avatarBase64.startsWith('data:image/')) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid avatar format. Must be base64 image data.' 
        });
      }

      const updatedUser = await UserService.updateUserProfile(userId, {
        profile_picture_url: avatarBase64
      });

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        user: updatedUser
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload avatar',
        error: error.message || 'Unknown error'
      });
    }
  }

  // Admin: List users
  static async listUsers(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Forbidden: Admin access required' 
        });
      }

      const limit = parseInt(String(req.query.limit || '50'), 10);
      const offset = parseInt(String(req.query.offset || '0'), 10);
      
      const users = await UserService.listAllUsers(limit, offset);
      
      res.json({
        success: true,
        users,
        limit,
        offset,
        total: users.length
      });
    } catch (error: any) {
      console.error('List users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list users',
        error: error.message
      });
    }
  }

  // Legacy support - delegate to old UserController
  static async legacyGetMe(req: AuthRequest, res: Response) {
    const { UserController } = await import('./UserController');
    return UserController.getMe(req, res);
  }

  static async legacyUpdateMe(req: AuthRequest, res: Response) {
    const { UserController } = await import('./UserController');
    return UserController.updateMe(req, res);
  }

  static async legacyUploadAvatar(req: AuthRequest, res: Response) {
    const { UserController } = await import('./UserController');
    return UserController.uploadAvatar(req, res);
  }

  static async legacyListUsers(req: AuthRequest, res: Response) {
    const { UserController } = await import('./UserController');
    return UserController.listUsers(req, res);
  }
}