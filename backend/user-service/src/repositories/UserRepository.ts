import { Pool } from 'pg';
import { User, UserResponse, RegisterUserPayload, UpdateUserProfilePayload } from '../models/User';
import pool from '../config/database';
import bcrypt from 'bcrypt';

export class UserRepository {
  private static pool: Pool = pool;

  // Create new user (registration)
  static async create(userData: RegisterUserPayload): Promise<UserResponse> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const query = `
      INSERT INTO users (name, email, password, gender, age, weight, height, fitness_goal, preferred_diet, payment_method)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING user_id, name, email, gender, age, weight, height, fitness_goal, preferred_diet, 
                subscription_status, payment_method, created_at, updated_at, is_active, 
                last_login, email_verified, profile_picture_url
    `;
    
    const values = [
      userData.name,
      userData.email,
      hashedPassword,
      userData.gender || null,
      userData.age || null,
      userData.weight || null,
      userData.height || null,
      userData.fitness_goal || null,
      userData.preferred_diet || null,
      userData.payment_method || null
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Get user by email (for login)
  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  // Get user by ID
  static async findById(userId: string): Promise<UserResponse | null> {
    const query = `
      SELECT user_id, name, email, gender, age, weight, height, fitness_goal, preferred_diet,
             subscription_status, payment_method, created_at, updated_at, is_active,
             last_login, email_verified, profile_picture_url
      FROM users 
      WHERE user_id = $1 AND is_active = true
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  // Update user profile
  static async updateProfile(userId: string, data: UpdateUserProfilePayload): Promise<UserResponse> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.gender !== undefined) {
      updateFields.push(`gender = $${paramIndex++}`);
      values.push(data.gender);
    }
    if (data.age !== undefined) {
      updateFields.push(`age = $${paramIndex++}`);
      values.push(data.age);
    }
    if (data.weight !== undefined) {
      updateFields.push(`weight = $${paramIndex++}`);
      values.push(data.weight);
    }
    if (data.height !== undefined) {
      updateFields.push(`height = $${paramIndex++}`);
      values.push(data.height);
    }
    if (data.fitness_goal !== undefined) {
      updateFields.push(`fitness_goal = $${paramIndex++}`);
      values.push(data.fitness_goal);
    }
    if (data.preferred_diet !== undefined) {
      updateFields.push(`preferred_diet = $${paramIndex++}`);
      values.push(data.preferred_diet);
    }
    if (data.payment_method !== undefined) {
      updateFields.push(`payment_method = $${paramIndex++}`);
      values.push(data.payment_method);
    }
    if (data.profile_picture_url !== undefined) {
      updateFields.push(`profile_picture_url = $${paramIndex++}`);
      values.push(data.profile_picture_url);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING user_id, name, email, gender, age, weight, height, fitness_goal, preferred_diet,
                subscription_status, payment_method, created_at, updated_at, is_active,
                last_login, email_verified, profile_picture_url
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Update last login
  static async updateLastLogin(userId: string): Promise<void> {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1';
    await this.pool.query(query, [userId]);
  }

  // Check if email exists
  static async emailExists(email: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return result.rows.length > 0;
  }

  // Verify email
  static async verifyEmail(userId: string): Promise<void> {
    const query = 'UPDATE users SET email_verified = true WHERE user_id = $1';
    await this.pool.query(query, [userId]);
  }

  // Update subscription status
  static async updateSubscription(userId: string, status: 'Basic' | 'Premium'): Promise<void> {
    const query = 'UPDATE users SET subscription_status = $1 WHERE user_id = $2';
    await this.pool.query(query, [status, userId]);
  }

  // Soft delete user
  static async deactivate(userId: string): Promise<void> {
    const query = 'UPDATE users SET is_active = false WHERE user_id = $1';
    await this.pool.query(query, [userId]);
  }

  // Admin: List all users
  static async listUsers(limit = 50, offset = 0): Promise<UserResponse[]> {
    const query = `
      SELECT user_id, name, email, gender, age, weight, height, fitness_goal, preferred_diet,
             subscription_status, payment_method, created_at, updated_at, is_active,
             last_login, email_verified, profile_picture_url
      FROM users 
      WHERE is_active = true
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  // Validate password
  static async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
}