import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { CreateUserRequest, UpdateUserRequest } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

export class UserController {
  static getProfile(req: AuthRequest, res: Response): void {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const user = UserService.getUserById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  }

  static updateProfile(req: AuthRequest, res: Response): void {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const updateData: UpdateUserRequest = req.body;
      const updatedUser = UserService.updateUser(userId, updateData);

      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }

  static getAllUsers(req: AuthRequest, res: Response): void {
    try {
      const users = UserService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }

  static getUserById(req: AuthRequest, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }

      const user = UserService.getUserById(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  }

  static createUser(req: AuthRequest, res: Response): void {
    try {
      const userData: CreateUserRequest = req.body;

      // Basic validation
      if (!userData.username || !userData.email) {
        res.status(400).json({ message: 'Username and email are required' });
        return;
      }

      // Check if username already exists
      const existingUser = UserService.getUserByUsername(userData.username);
      if (existingUser) {
        res.status(409).json({ message: 'Username already exists' });
        return;
      }

      const newUser = UserService.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create user' });
    }
  }

  static updateUser(req: AuthRequest, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }

      const updateData: UpdateUserRequest = req.body;
      const updatedUser = UserService.updateUser(id, updateData);

      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user' });
    }
  }

  static deleteUser(req: AuthRequest, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }

      const deleted = UserService.deleteUser(id);
      if (!deleted) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  }
}
