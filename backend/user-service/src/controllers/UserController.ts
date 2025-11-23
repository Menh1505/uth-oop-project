import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { UserService, buildPublicAvatarUrl } from '../services/UserService.js';
import { avatarService } from '../services/avatarService.js';

const getRequestOrigin = (req: AuthRequest): string | undefined => {
  const forwardedHost = Array.isArray(req.headers['x-forwarded-host'])
    ? req.headers['x-forwarded-host'][0]
    : (req.headers['x-forwarded-host'] as string | undefined);
  const forwardedProto = Array.isArray(req.headers['x-forwarded-proto'])
    ? req.headers['x-forwarded-proto'][0]
    : (req.headers['x-forwarded-proto'] as string | undefined);
  const forwardedPort = Array.isArray(req.headers['x-forwarded-port'])
    ? req.headers['x-forwarded-port'][0]
    : (req.headers['x-forwarded-port'] as string | undefined);

  let host = forwardedHost || req.get('host') || undefined;
  let port = forwardedPort;

  if (!port) {
    const socketPort = req.socket?.localPort;
    if (socketPort) port = `${socketPort}`;
  }

  if (host && !host.includes(':') && port && port !== '80' && port !== '443') {
    host = `${host}:${port}`;
  }

  if (!host) return undefined;
  const protocol = forwardedProto || req.protocol || 'http';
  return `${protocol}://${host}`.replace(/\/$/, '');
};

const withPublicAvatar = <T extends Record<string, any>>(
  entity: T | null | undefined,
  origin?: string
): T | null | undefined => {
  if (!entity) return entity;
  if (!Object.prototype.hasOwnProperty.call(entity, 'profile_picture_url')) {
    return entity;
  }
  const current = entity as T & { profile_picture_url?: string | null };
  return {
    ...entity,
    profile_picture_url:
      buildPublicAvatarUrl(current.profile_picture_url, origin) ?? null,
  } as T;
};

const withPublicAvatarList = <T extends Record<string, any>>(
  items: T[] | undefined,
  origin?: string
): T[] | undefined => {
  if (!items) return items;
  return items.map((item) => withPublicAvatar(item, origin)!) as T[];
};

export class UserController {
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
      const origin = getRequestOrigin(req);
      const newUser = await UserService.registerUser(userData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: withPublicAvatar(newUser, origin)
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

      const origin = getRequestOrigin(req);
      const user = await UserService.loginUser({ email, password });
      const needsOnboarding = await UserService.needsOnboarding(user.user_id);

      res.json({
        success: true,
        message: 'Login successful',
        user: withPublicAvatar(user, origin),
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
      const email = req.user?.email;
      const origin = getRequestOrigin(req);
      if (!userId || !email) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      try {
        const user = await UserService.getUserProfile(userId);
        const needsOnboarding = await UserService.needsOnboarding(userId);

        res.json({
          success: true,
          user: withPublicAvatar(user, origin),
          needsOnboarding
        });
      } catch (err: any) {
        if (err.message === 'User not found') {
          // User doesn't exist in user_db, create it with email from JWT
          const newUser = await UserService.createUserWithEmail(userId, email);
          const needsOnboarding = await UserService.needsOnboarding(userId);
          res.json({
            success: true,
            user: withPublicAvatar(newUser, origin),
            needsOnboarding
          });
        } else {
          throw err;
        }
      }
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

      const origin = getRequestOrigin(req);
      const updateData = req.body;
      const updatedUser = await UserService.updateUserProfile(userId, updateData);
      const needsOnboarding = await UserService.needsOnboarding(userId);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: withPublicAvatar(updatedUser, origin),
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

      const origin = getRequestOrigin(req);
      const onboardingData = req.body;
      const updatedUser = await UserService.completeOnboarding(userId, onboardingData);

      res.json({
        success: true,
        message: 'Onboarding completed successfully',
        user: withPublicAvatar(updatedUser, origin),
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

  static async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const origin = getRequestOrigin(req);
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      let storedAvatar: string | null = null;
      const currentProfile = await UserService.getUserProfile(userId).catch(() => null);

      try {
        if (req.file) {
          const saved = await avatarService.saveUploadedFile(userId, req.file);
          storedAvatar = saved.publicUrl;
        } else if (req.body?.avatar) {
          const saved = await avatarService.saveBase64Image(
            userId,
            req.body.avatar
          );
          storedAvatar = saved.publicUrl;
        } else if (req.body?.profile_picture_url) {
          const saved = await avatarService.saveBase64Image(
            userId,
            req.body.profile_picture_url
          );
          storedAvatar = saved.publicUrl;
        }
      } catch (avatarError: any) {
        return res.status(400).json({
          success: false,
          message: avatarError?.message || 'Invalid avatar data',
        });
      }

      if (!storedAvatar) {
        return res.status(400).json({
          success: false,
          message: 'No avatar data provided',
        });
      }

      if (currentProfile?.profile_picture_url) {
        await avatarService.deleteAvatarByUrl(
          currentProfile.profile_picture_url
        );
      }

      const updatedUser = await UserService.updateUserProfile(userId, {
        profile_picture_url: storedAvatar,
      });

      return res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        profile_picture_url: buildPublicAvatarUrl(storedAvatar, origin),
        user: withPublicAvatar(updatedUser, origin),
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      return res.status(500).json({
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
      
      const origin = getRequestOrigin(req);
      const users = await UserService.listAllUsers(limit, offset);
      
      res.json({
        success: true,
        users: {
          ...users,
          users: withPublicAvatarList(users.users, origin) || [],
        },
        limit,
        offset,
        total: users.total
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
}
