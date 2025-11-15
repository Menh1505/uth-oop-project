import { Pool } from 'pg';
import pool from '../config/database';

export class ProfileRepository {
  private static pool: Pool = pool;

  // Upsert a skeleton profile when user registers (legacy support)
  static async upsertSkeleton(userId: string, guessName?: string | null): Promise<void> {
    // Since we're using the new users table structure, we'll update the name if it's not set
    // and the user exists in the users table
    
    const query = `
      UPDATE users 
      SET name = COALESCE(name, $2)
      WHERE user_id = $1 AND (name IS NULL OR name = '')
    `;
    
    try {
      await this.pool.query(query, [userId, guessName || 'User']);
    } catch (error) {
      // User might not exist yet, that's OK for this legacy function
      console.warn(`Could not update skeleton profile for user ${userId}:`, error);
    }
  }

  // Set last login timestamp (legacy support)
  static async setLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;
    
    try {
      await this.pool.query(query, [userId]);
    } catch (error) {
      console.warn(`Could not update last login for user ${userId}:`, error);
    }
  }

  // Get profile by ID (legacy support)
  static async getById(userId: string): Promise<any | null> {
    const query = `
      SELECT 
        user_id as id,
        name as full_name,
        profile_picture_url as avatar_url,
        null as phone,
        null as date_of_birth,
        CASE 
          WHEN gender = 'Male' THEN 'male'
          WHEN gender = 'Female' THEN 'female'  
          WHEN gender = 'Other' THEN 'other'
          ELSE 'prefer_not_to_say'
        END as gender,
        null as bio,
        'UTC' as timezone,
        'en' as language,
        created_at,
        updated_at,
        last_login
      FROM users 
      WHERE user_id = $1 AND is_active = true
    `;
    
    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error getting profile for user ${userId}:`, error);
      return null;
    }
  }

  // Update profile (legacy support)
  static async update(userId: string, data: any): Promise<any> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Map legacy fields to new structure
    if (data.full_name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(data.full_name);
    }
    
    if (data.avatar_url !== undefined) {
      updateFields.push(`profile_picture_url = $${paramIndex++}`);
      values.push(data.avatar_url);
    }

    // Map gender back to new enum values
    if (data.gender !== undefined) {
      let mappedGender = null;
      switch (data.gender) {
        case 'male':
          mappedGender = 'Male';
          break;
        case 'female':
          mappedGender = 'Female';
          break;
        case 'other':
        case 'prefer_not_to_say':
          mappedGender = 'Other';
          break;
      }
      
      if (mappedGender) {
        updateFields.push(`gender = $${paramIndex++}`);
        values.push(mappedGender);
      }
    }

    if (updateFields.length === 0) {
      // No valid fields to update, just return current profile
      return this.getById(userId);
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING user_id
    `;

    try {
      await this.pool.query(query, values);
      return this.getById(userId);
    } catch (error) {
      console.error(`Error updating profile for user ${userId}:`, error);
      throw error;
    }
  }

  // Create a new profile (legacy support)
  static async create(userId: string, data: any): Promise<any> {
    // In the new structure, profile data is part of the users table
    // So this would be an update operation
    return this.update(userId, data);
  }

  // Delete profile (legacy support)
  static async delete(userId: string): Promise<void> {
    // In the new structure, we soft delete by setting is_active = false
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;
    
    try {
      await this.pool.query(query, [userId]);
    } catch (error) {
      console.error(`Error deleting profile for user ${userId}:`, error);
      throw error;
    }
  }
}