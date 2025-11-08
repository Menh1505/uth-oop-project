import jwt, { Secret } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { jwtConfig } from '../config/jwt';
import pool from '../config/database';
import { MessageService } from './messageService';

// Remove mock database
// const users: User[] = [
//   { id: 1, username: 'admin', password: bcrypt.hashSync('password', 10), email: 'admin@example.com', role: 'admin' },
// ];

export class AuthService {
  static async login(email: string, password: string): Promise<{ token: string } | null> {
    try {
      const result = await pool.query('SELECT * FROM users_auth WHERE email = $1 AND status = $2', [email, 'active']);
      const user = result.rows[0];
      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return null;

      // For now, assume role 'user' or check roles table later
      // @ts-ignore
      const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, jwtConfig.secret as string, { expiresIn: jwtConfig.expiresIn });

      // Publish event
      await MessageService.publish('user.logged_in', { userId: user.id, email: user.email, role: 'user', timestamp: new Date().toISOString() });

      return { token };
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  static async register(email: string, password: string, username?: string): Promise<{ success: boolean } | null> {
    try {
      // Check if user already exists
      const existing = await pool.query('SELECT id FROM users_auth WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Insert new user
      await pool.query(
        'INSERT INTO users_auth (email, password_hash, status) VALUES ($1, $2, $3)',
        [email, hashedPassword, 'active']
      );

      return { success: true };
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  }

  static async adminLogin(username: string, password: string): Promise<{ token: string } | null> {
    try {
      const result = await pool.query(`
        SELECT u.*, r.name as role_name 
        FROM users_auth u 
        JOIN user_roles ur ON u.id = ur.user_id 
        JOIN roles r ON ur.role_id = r.id 
        WHERE u.username = $1 AND u.status = $2 AND r.name = $3
      `, [username, 'active', 'admin']);
      
      const user = result.rows[0];
      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return null;

      // @ts-ignore
      const token = jwt.sign({ id: user.id, email: user.email, role: 'admin' }, jwtConfig.secret as string, { expiresIn: jwtConfig.expiresIn });

      // Publish event
      await MessageService.publish('user.logged_in', { userId: user.id, username: user.username, role: 'admin', timestamp: new Date().toISOString() });

      return { token };
    } catch (error) {
      console.error('Admin login error:', error);
      return null;
    }
  }

  static async logout(token: string): Promise<{ success: boolean } | null> {
    try {
      // Decode token to get user_id and expiration
      const decoded = jwt.verify(token, jwtConfig.secret as string) as any;
      if (!decoded || !decoded.id) {
        throw new Error('Invalid token');
      }

      // Hash the token for storage
      const tokenHash = bcrypt.hashSync(token, 10);

      // Calculate expires_at from token or use a default (e.g., 1 hour from now)
      const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 3600000); // 1 hour

      // Insert into blacklist
      await pool.query(
        'INSERT INTO token_blacklist (token_hash, user_id, expires_at) VALUES ($1, $2, $3) ON CONFLICT (token_hash) DO NOTHING',
        [tokenHash, decoded.id, expiresAt]
      );

      // Publish logout event
      await MessageService.publish('user.logged_out', { userId: decoded.id, timestamp: new Date().toISOString() });

      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  }
}
