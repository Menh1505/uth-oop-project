import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export class AuthController {
  static async login(req: Request, res: Response) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const result = await AuthService.login(username, password); // username is email
    if (!result) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json(result);
  }

  static async adminLogin(req: Request, res: Response) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const result = await AuthService.adminLogin(username, password);
    if (!result) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    res.json(result);
  }

  static async register(req: Request, res: Response) {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    try {
      const result = await AuthService.register(email, password, username);
      if (result?.success) {
        res.status(201).json({ message: 'Đăng ký thành công! Vui lòng đăng nhập.' });
      } else {
        res.status(400).json({ message: 'Đăng ký thất bại' });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required' });
      }

      const token = authHeader.substring(7); // Remove 'Bearer '

      const result = await AuthService.logout(token);
      if (result?.success) {
        res.json({ message: 'Logout successful' });
      } else {
        res.status(400).json({ message: 'Logout failed' });
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async verify(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required' });
      }

      const token = authHeader.substring(7); // Remove 'Bearer '

      const decoded = jwt.verify(token, jwtConfig.secret as string) as any;
      res.json({
        authed: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        }
      });
    } catch (error: any) {
      console.error('Verify error:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  }
}
