import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { UserService } from '../services/UserService';

export class UserController {
  static async status(_req: AuthRequest, res: Response) {
    res.json({
      service: 'user-service',
      status: 'healthy',
      version: '1.0.0',
      database: process.env.DB_NAME || 'user_db',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /users/me',
        'PUT /users/me',
        'GET /admin/users?limit=&offset='
      ]
    });
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'User not authenticated' });
      const data = await UserService.getProfile(userId);
      if (!data || !data.profile) {
        // Profile not found - user needs onboarding
        return res.status(200).json({ 
          onboarding: true, 
          message: 'Profile not setup yet, please complete onboarding',
          user_id: userId,
          email: req.user?.email
        });
      }
      res.json({ onboarding: false, ...data });
    } catch (error: any) {
      console.error('getMe error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch profile',
        error: error.message || 'Unknown error'
      });
    }
  }

  static async updateMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'User not authenticated' });
      const updated = await UserService.updateProfile(userId, req.body);
      res.json({ onboarding: false, ...updated });
    } catch (error: any) {
      console.error('updateMe error:', error);
      res.status(500).json({ 
        message: 'Failed to update profile',
        error: error.message || 'Unknown error'
      });
    }
  }

  static async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'User not authenticated' });

      // Get base64 avatar from request body or files
      let avatarBase64: string | null = null;

      // Check for file in body (raw binary)
      if ((req as any).body && typeof (req as any).body === 'string') {
        avatarBase64 = (req as any).body;
      }

      // Or get from form field
      const avatarField = (req as any).body?.avatar;
      if (avatarField) {
        avatarBase64 = avatarField;
      }

      if (!avatarBase64) {
        return res.status(400).json({ message: 'No avatar data provided' });
      }

      // Basic validation
      if (typeof avatarBase64 !== 'string' || !avatarBase64.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Invalid avatar format. Must be base64 image data.' });
      }

      // Update profile with avatar
      const updated = await UserService.updateProfile(userId, {
        avatar_url: avatarBase64
      });

      res.json({ 
        message: 'Avatar uploaded successfully',
        avatar_url: avatarBase64,
        profile: updated
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ 
        message: 'Failed to upload avatar',
        error: error.message || 'Unknown error'
      });
    }
  }

  // simple admin
  static async listUsers(req: AuthRequest, res: Response) {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const limit = parseInt(String(req.query.limit || '50'), 10);
    const offset = parseInt(String(req.query.offset || '0'), 10);
    const data = await UserService.listProfiles(limit, offset);
    res.json({ items: data, limit, offset });
  }
}
