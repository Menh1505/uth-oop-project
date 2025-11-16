import { Pool } from 'pg';
import { Goal, UserGoal, AssignGoalPayload, UpdateUserGoalPayload } from '../models/User';
import pool from '../config/database';

export class GoalRepository {
  private static pool: Pool = pool;

  // Get all available goals
  static async getAllGoals(): Promise<Goal[]> {
    const query = `
      SELECT * FROM goals 
      WHERE is_active = true 
      ORDER BY goal_type
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  // Get goal by ID
  static async getGoalById(goalId: string): Promise<Goal | null> {
    const query = 'SELECT * FROM goals WHERE goal_id = $1 AND is_active = true';
    const result = await this.pool.query(query, [goalId]);
    return result.rows[0] || null;
  }

  // Get goals by type
  static async getGoalsByType(goalType: string): Promise<Goal[]> {
    const query = `
      SELECT * FROM goals 
      WHERE goal_type = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [goalType]);
    return result.rows;
  }

  // Assign goal to user
  static async assignGoalToUser(userId: string, assignData: AssignGoalPayload): Promise<UserGoal> {
    const query = `
      INSERT INTO user_goals (user_id, goal_id, target_completion_date, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      userId,
      assignData.goal_id,
      assignData.target_completion_date || null,
      assignData.notes || null
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Get user's goals
  static async getUserGoals(userId: string): Promise<(UserGoal & { goal: Goal })[]> {
    const query = `
      SELECT 
        ug.*,
        g.goal_type,
        g.target_calories,
        g.target_protein,
        g.target_carbs,
        g.target_fat,
        g.target_weight,
        g.target_duration_weeks,
        g.description as goal_description
      FROM user_goals ug
      JOIN goals g ON ug.goal_id = g.goal_id
      WHERE ug.user_id = $1
      ORDER BY ug.assigned_date DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(row => ({
      user_goal_id: row.user_goal_id,
      user_id: row.user_id,
      goal_id: row.goal_id,
      assigned_date: row.assigned_date,
      target_completion_date: row.target_completion_date,
      actual_completion_date: row.actual_completion_date,
      progress_percentage: row.progress_percentage,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      goal: {
        goal_id: row.goal_id,
        goal_type: row.goal_type,
        target_calories: row.target_calories,
        target_protein: row.target_protein,
        target_carbs: row.target_carbs,
        target_fat: row.target_fat,
        target_weight: row.target_weight,
        target_duration_weeks: row.target_duration_weeks,
        description: row.goal_description,
        created_at: row.created_at,
        updated_at: row.updated_at,
        is_active: true
      }
    }));
  }

  // Get active user goals
  static async getActiveUserGoals(userId: string): Promise<(UserGoal & { goal: Goal })[]> {
    const query = `
      SELECT 
        ug.*,
        g.goal_type,
        g.target_calories,
        g.target_protein,
        g.target_carbs,
        g.target_fat,
        g.target_weight,
        g.target_duration_weeks,
        g.description as goal_description
      FROM user_goals ug
      JOIN goals g ON ug.goal_id = g.goal_id
      WHERE ug.user_id = $1 AND ug.status = 'Active'
      ORDER BY ug.assigned_date DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(row => ({
      user_goal_id: row.user_goal_id,
      user_id: row.user_id,
      goal_id: row.goal_id,
      assigned_date: row.assigned_date,
      target_completion_date: row.target_completion_date,
      actual_completion_date: row.actual_completion_date,
      progress_percentage: row.progress_percentage,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      goal: {
        goal_id: row.goal_id,
        goal_type: row.goal_type,
        target_calories: row.target_calories,
        target_protein: row.target_protein,
        target_carbs: row.target_carbs,
        target_fat: row.target_fat,
        target_weight: row.target_weight,
        target_duration_weeks: row.target_duration_weeks,
        description: row.goal_description,
        created_at: row.created_at,
        updated_at: row.updated_at,
        is_active: true
      }
    }));
  }

  // Update user goal
  static async updateUserGoal(userGoalId: string, updateData: UpdateUserGoalPayload): Promise<UserGoal> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.progress_percentage !== undefined) {
      updateFields.push(`progress_percentage = $${paramIndex++}`);
      values.push(updateData.progress_percentage);
    }
    if (updateData.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
      
      // If status is completed, set actual_completion_date
      if (updateData.status === 'Completed') {
        updateFields.push(`actual_completion_date = CURRENT_TIMESTAMP`);
      }
    }
    if (updateData.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      values.push(updateData.notes);
    }
    if (updateData.target_completion_date !== undefined) {
      updateFields.push(`target_completion_date = $${paramIndex++}`);
      values.push(updateData.target_completion_date);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userGoalId);

    const query = `
      UPDATE user_goals 
      SET ${updateFields.join(', ')}
      WHERE user_goal_id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Get user goal by ID
  static async getUserGoalById(userGoalId: string): Promise<UserGoal | null> {
    const query = 'SELECT * FROM user_goals WHERE user_goal_id = $1';
    const result = await this.pool.query(query, [userGoalId]);
    return result.rows[0] || null;
  }

  // Remove user goal (soft delete by setting status to cancelled)
  static async removeUserGoal(userGoalId: string): Promise<void> {
    const query = `
      UPDATE user_goals 
      SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE user_goal_id = $1
    `;
    await this.pool.query(query, [userGoalId]);
  }

  // Check if user already has an active goal of the same type
  static async hasActiveGoalOfType(userId: string, goalType: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM user_goals ug
      JOIN goals g ON ug.goal_id = g.goal_id
      WHERE ug.user_id = $1 AND g.goal_type = $2 AND ug.status = 'Active'
    `;
    const result = await this.pool.query(query, [userId, goalType]);
    return result.rows.length > 0;
  }
}