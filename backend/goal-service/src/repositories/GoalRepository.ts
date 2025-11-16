import { Pool, PoolClient } from 'pg';
import pool from '../config/database';
import {
  Goal,
  GoalType,
  UserGoal,
  UserGoalWithGoal,
  CreateGoalRequest,
  UpdateGoalRequest,
  AssignGoalRequest,
  UpdateUserGoalRequest,
  GoalFilters,
  GoalPagination,
  GoalSearchResult,
  GoalStatistics,
  GoalProgress,
  GoalCurrentMetrics,
  DailyGoalTracking,
  WeeklyGoalSummary,
  MonthlyGoalProgress
} from '../models/Goal';

export class GoalRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  // =================== Goal CRUD Operations ===================

  async createGoal(goalData: CreateGoalRequest): Promise<Goal> {
    const query = `
      INSERT INTO goals (
        goal_type, target_calories, target_protein, target_carbs, 
        target_fat, target_weight, target_duration_weeks, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      goalData.goal_type,
      goalData.target_calories,
      goalData.target_protein,
      goalData.target_carbs,
      goalData.target_fat,
      goalData.target_weight,
      goalData.target_duration_weeks,
      goalData.description
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getGoalById(goalId: string): Promise<Goal | null> {
    const query = 'SELECT * FROM goals WHERE goal_id = $1';
    const result = await this.pool.query(query, [goalId]);
    return result.rows[0] || null;
  }

  async updateGoal(goalId: string, updateData: UpdateGoalRequest): Promise<Goal | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (setClause.length === 0) {
      return this.getGoalById(goalId);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    const query = `
      UPDATE goals 
      SET ${setClause.join(', ')}
      WHERE goal_id = $${paramIndex}
      RETURNING *
    `;
    
    values.push(goalId);
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    const query = 'DELETE FROM goals WHERE goal_id = $1';
    const result = await this.pool.query(query, [goalId]);
    return (result.rowCount || 0) > 0;
  }

  async getAllGoals(filters?: GoalFilters, pagination?: GoalPagination): Promise<Goal[]> {
    let query = 'SELECT * FROM goals WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    // Apply filters
    if (filters?.goal_type) {
      query += ` AND goal_type = $${paramIndex}`;
      values.push(filters.goal_type);
      paramIndex++;
    }

    if (filters?.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      values.push(filters.is_active);
      paramIndex++;
    }

    if (filters?.created_after) {
      query += ` AND created_at >= $${paramIndex}`;
      values.push(filters.created_after);
      paramIndex++;
    }

    if (filters?.created_before) {
      query += ` AND created_at <= $${paramIndex}`;
      values.push(filters.created_before);
      paramIndex++;
    }

    // Apply sorting
    if (pagination?.sort_by) {
      query += ` ORDER BY ${pagination.sort_by} ${pagination.sort_order || 'DESC'}`;
    } else {
      query += ' ORDER BY created_at DESC';
    }

    // Apply pagination
    if (pagination?.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(pagination.limit);
      paramIndex++;
    }

    if (pagination?.page && pagination?.limit) {
      const offset = (pagination.page - 1) * pagination.limit;
      query += ` OFFSET $${paramIndex}`;
      values.push(offset);
    }

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  // =================== User Goal Operations ===================

  async assignGoalToUser(userId: string, assignData: AssignGoalRequest): Promise<UserGoal> {
    const query = `
      INSERT INTO user_goals (
        user_id, goal_id, target_completion_date, notes
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      userId,
      assignData.goal_id,
      assignData.target_completion_date,
      assignData.notes
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getUserGoalById(userGoalId: string): Promise<UserGoal | null> {
    const query = 'SELECT * FROM user_goals WHERE user_goal_id = $1';
    const result = await this.pool.query(query, [userGoalId]);
    return result.rows[0] || null;
  }

  async updateUserGoal(userGoalId: string, updateData: UpdateUserGoalRequest): Promise<UserGoal | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (setClause.length === 0) {
      return this.getUserGoalById(userGoalId);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    const query = `
      UPDATE user_goals 
      SET ${setClause.join(', ')}
      WHERE user_goal_id = $${paramIndex}
      RETURNING *
    `;
    
    values.push(userGoalId);
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async getUserGoals(
    userId: string, 
    filters?: GoalFilters, 
    pagination?: GoalPagination
  ): Promise<GoalSearchResult> {
    let query = `
      SELECT 
        ug.*,
        g.goal_type, g.target_calories, g.target_protein, g.target_carbs,
        g.target_fat, g.target_weight, g.target_duration_weeks, 
        g.description, g.is_active,
        g.created_at as goal_created_at, g.updated_at as goal_updated_at
      FROM user_goals ug
      JOIN goals g ON ug.goal_id = g.goal_id
      WHERE ug.user_id = $1
    `;
    
    const values = [userId];
    let paramIndex = 2;

    // Apply filters
    if (filters?.status) {
      query += ` AND ug.status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters?.goal_type) {
      query += ` AND g.goal_type = $${paramIndex}`;
      values.push(filters.goal_type);
      paramIndex++;
    }

    if (filters?.completion_status) {
      const now = new Date();
      switch (filters.completion_status) {
        case 'Overdue':
          query += ` AND ug.target_completion_date < $${paramIndex} AND ug.status = 'Active'`;
          values.push(now.toISOString());
          paramIndex++;
          break;
        case 'OnTrack':
          query += ` AND ug.target_completion_date >= $${paramIndex} AND ug.status = 'Active'`;
          values.push(now.toISOString());
          paramIndex++;
          break;
        case 'Ahead':
          query += ` AND ug.progress_percentage > 80 AND ug.status = 'Active'`;
          break;
      }
    }

    if (filters?.progress_min !== undefined) {
      query += ` AND ug.progress_percentage >= $${paramIndex}`;
      values.push(filters.progress_min.toString());
      paramIndex++;
    }

    if (filters?.progress_max !== undefined) {
      query += ` AND ug.progress_percentage <= $${paramIndex}`;
      values.push(filters.progress_max.toString());
      paramIndex++;
    }

    // Count query for pagination
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await this.pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count);

    // Apply sorting
    if (pagination?.sort_by) {
      query += ` ORDER BY ug.${pagination.sort_by} ${pagination.sort_order || 'DESC'}`;
    } else {
      query += ' ORDER BY ug.created_at DESC';
    }

    // Apply pagination
    const limit = pagination?.limit || 20;
    const page = pagination?.page || 1;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit.toString(), offset.toString());

    const result = await this.pool.query(query, values);
    
    // Transform results
    const goals: UserGoalWithGoal[] = result.rows.map(row => ({
      user_goal_id: row.user_goal_id,
      user_id: row.user_id,
      goal_id: row.goal_id,
      assigned_date: row.assigned_date,
      target_completion_date: row.target_completion_date,
      actual_completion_date: row.actual_completion_date,
      progress_percentage: parseFloat(row.progress_percentage),
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      goal: {
        goal_id: row.goal_id,
        goal_type: row.goal_type,
        target_calories: row.target_calories,
        target_protein: parseFloat(row.target_protein),
        target_carbs: parseFloat(row.target_carbs),
        target_fat: parseFloat(row.target_fat),
        target_weight: parseFloat(row.target_weight),
        target_duration_weeks: row.target_duration_weeks,
        description: row.description,
        created_at: row.goal_created_at,
        updated_at: row.goal_updated_at,
        is_active: row.is_active
      }
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      goals,
      pagination: {
        page,
        limit,
        total: totalCount,
        total_pages: totalPages
      },
      total_count: totalCount,
      current_page: page,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_previous: page > 1
    };
  }

  async deleteUserGoal(userGoalId: string): Promise<boolean> {
    const query = 'DELETE FROM user_goals WHERE user_goal_id = $1';
    const result = await this.pool.query(query, [userGoalId]);
    return (result.rowCount || 0) > 0;
  }

  // =================== Goal Analytics ===================

  async getUserGoalStatistics(userId: string): Promise<GoalStatistics> {
    const query = `
      SELECT 
        COUNT(*) as total_goals,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_goals,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_goals,
        COUNT(CASE WHEN status = 'Paused' THEN 1 END) as paused_goals,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_goals,
        AVG(CASE 
          WHEN status = 'Completed' AND actual_completion_date IS NOT NULL 
          THEN EXTRACT(days FROM (actual_completion_date - assigned_date)) 
        END) as avg_completion_days
      FROM user_goals ug
      JOIN goals g ON ug.goal_id = g.goal_id
      WHERE ug.user_id = $1
    `;

    const result = await this.pool.query(query, [userId]);
    const stats = result.rows[0];

    // Get goal type distribution
    const typeQuery = `
      SELECT g.goal_type, COUNT(*) as count
      FROM user_goals ug
      JOIN goals g ON ug.goal_id = g.goal_id
      WHERE ug.user_id = $1
      GROUP BY g.goal_type
      ORDER BY count DESC
    `;

    const typeResult = await this.pool.query(typeQuery, [userId]);
    const goalsByType = typeResult.rows.reduce((acc, row) => {
      acc[row.goal_type] = parseInt(row.count);
      return acc;
    }, {});

    // Get monthly progress
    const monthlyQuery = `
      SELECT 
        TO_CHAR(assigned_date, 'YYYY-MM') as month,
        COUNT(*) as goals_started,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as goals_completed,
        AVG(progress_percentage) as average_progress
      FROM user_goals ug
      WHERE ug.user_id = $1 
        AND assigned_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(assigned_date, 'YYYY-MM')
      ORDER BY month DESC
    `;

    const monthlyResult = await this.pool.query(monthlyQuery, [userId]);
    const monthlyProgress: MonthlyGoalProgress[] = monthlyResult.rows.map(row => ({
      month: row.month,
      goals_created: parseInt(row.goals_started || 0),
      goals_started: parseInt(row.goals_started),
      goals_completed: parseInt(row.goals_completed),
      average_progress: parseFloat(row.average_progress) || 0
    }));

    const totalGoals = parseInt(stats.total_goals);
    const completedGoals = parseInt(stats.completed_goals);
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    // Determine most common goal type
    const mostCommonGoalType = (Object.keys(goalsByType).reduce((a, b) => 
      goalsByType[a] > goalsByType[b] ? a : b, Object.keys(goalsByType)[0]
    ) || 'General Fitness') as GoalType;

    return {
      total_goals: totalGoals,
      active_goals: parseInt(stats.active_goals),
      completed_goals: completedGoals,
      paused_goals: parseInt(stats.paused_goals),
      cancelled_goals: parseInt(stats.cancelled_goals),
      completion_rate: Math.round(completionRate * 100) / 100,
      average_progress: Math.round(parseFloat(stats.avg_progress || 0) * 100) / 100,
      average_completion_time_days: stats.avg_completion_days ? Math.round(parseFloat(stats.avg_completion_days)) : undefined,
      most_common_goal_type: mostCommonGoalType,
      goals_by_type: goalsByType,
      monthly_progress: monthlyProgress
    };
  }

  // =================== Progress Calculation ===================

  async calculateGoalProgress(userGoalId: string): Promise<GoalProgress | null> {
    const query = `
      SELECT 
        ug.*,
        g.goal_type, g.target_calories, g.target_protein, g.target_carbs,
        g.target_fat, g.target_weight, g.target_duration_weeks
      FROM user_goals ug
      JOIN goals g ON ug.goal_id = g.goal_id
      WHERE ug.user_goal_id = $1
    `;

    const result = await this.pool.query(query, [userGoalId]);
    if (result.rows.length === 0) return null;

    const userGoal = result.rows[0];
    
    // Calculate days remaining
    let daysRemaining: number | undefined;
    if (userGoal.target_completion_date) {
      const now = new Date();
      const targetDate = new Date(userGoal.target_completion_date);
      daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Mock current metrics calculation (in real implementation, this would query meal/exercise data)
    const currentMetrics: GoalCurrentMetrics = {
      days_active: Math.floor((new Date().getTime() - new Date(userGoal.assigned_date).getTime()) / (1000 * 60 * 60 * 24)),
      weeks_completed: Math.floor((new Date().getTime() - new Date(userGoal.assigned_date).getTime()) / (1000 * 60 * 60 * 24 * 7)),
      current_weight: 70, // This should come from user's latest weight entry
      average_daily_calories: 2000, // This should come from meal data
      average_daily_protein: 120,
      average_daily_carbs: 250,
      average_daily_fat: 65
    };

    // Generate recommendations based on progress
    const daysActive = currentMetrics.days_active || 1;
    
    // Estimate completion date based on current progress
    let estimatedCompletionDate: Date | undefined;
    if (userGoal.progress_percentage > 0 && daysRemaining) {
      const progressRate = parseFloat(userGoal.progress_percentage) / daysActive;
      const estimatedDaysToComplete = 100 / progressRate;
      estimatedCompletionDate = new Date();
      estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + estimatedDaysToComplete);
    }

    // Determine if on track
    const isOnTrack = daysRemaining 
      ? (parseFloat(userGoal.progress_percentage) / 100) >= (daysActive / (daysActive + daysRemaining))
      : parseFloat(userGoal.progress_percentage) > 50;

    return {
      user_goal_id: userGoal.user_goal_id,
      goal_type: userGoal.goal_type,
      target_metrics: {
        calories: userGoal.target_calories,
        protein: userGoal.target_protein,
        carbs: userGoal.target_carbs,
        fat: userGoal.target_fat,
        weight: userGoal.target_weight,
        duration_weeks: userGoal.target_duration_weeks
      },
      current_metrics: currentMetrics,
      progress_percentage: parseFloat(userGoal.progress_percentage),
      days_remaining: daysRemaining,
      estimated_completion_date: estimatedCompletionDate,
      on_track: isOnTrack
    };
  }

  private generateProgressRecommendations(
    goalType: string, 
    progressPercentage: number, 
    daysRemaining?: number
  ): string[] {
    const recommendations: string[] = [];

    if (progressPercentage < 25) {
      recommendations.push("Your progress is slower than expected. Consider reviewing your daily habits.");
      
      switch (goalType) {
        case 'Reduce Fat':
          recommendations.push("Focus on maintaining a consistent calorie deficit.");
          recommendations.push("Increase cardio exercises and monitor portion sizes.");
          break;
        case 'Build Muscle':
          recommendations.push("Ensure adequate protein intake (1.6-2.2g per kg body weight).");
          recommendations.push("Focus on progressive overload in strength training.");
          break;
        case 'Maintain Weight':
          recommendations.push("Monitor your calorie balance more closely.");
          break;
      }
    } else if (progressPercentage < 50) {
      recommendations.push("You're making steady progress. Keep up the good work!");
      recommendations.push("Consider tracking your daily metrics more consistently.");
    } else if (progressPercentage < 75) {
      recommendations.push("Great progress! You're well on your way to achieving your goal.");
    } else {
      recommendations.push("Excellent work! You're very close to achieving your goal.");
      recommendations.push("Start planning your next fitness goal.");
    }

    if (daysRemaining && daysRemaining < 7 && progressPercentage < 90) {
      recommendations.push("Time is running short. Focus on the most impactful activities.");
    }

    return recommendations;
  }

  // =================== Advanced Queries ===================

  async getGoalsByPopularity(limit: number = 10): Promise<Goal[]> {
    const query = `
      SELECT g.*, COUNT(ug.user_goal_id) as assignment_count
      FROM goals g
      LEFT JOIN user_goals ug ON g.goal_id = ug.goal_id
      WHERE g.is_active = true
      GROUP BY g.goal_id
      ORDER BY assignment_count DESC, g.created_at DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  async getRecentGoalActivity(userId: string, days: number = 30): Promise<UserGoalWithGoal[]> {
    const query = `
      SELECT 
        ug.*,
        g.goal_type, g.target_calories, g.target_protein, g.target_carbs,
        g.target_fat, g.target_weight, g.target_duration_weeks, 
        g.description, g.is_active,
        g.created_at as goal_created_at, g.updated_at as goal_updated_at
      FROM user_goals ug
      JOIN goals g ON ug.goal_id = g.goal_id
      WHERE ug.user_id = $1 
        AND (ug.updated_at >= CURRENT_DATE - INTERVAL '${days} days'
             OR ug.assigned_date >= CURRENT_DATE - INTERVAL '${days} days')
      ORDER BY ug.updated_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    
    return result.rows.map(row => ({
      user_goal_id: row.user_goal_id,
      user_id: row.user_id,
      goal_id: row.goal_id,
      assigned_date: row.assigned_date,
      target_completion_date: row.target_completion_date,
      actual_completion_date: row.actual_completion_date,
      progress_percentage: parseFloat(row.progress_percentage),
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      goal: {
        goal_id: row.goal_id,
        goal_type: row.goal_type,
        target_calories: row.target_calories,
        target_protein: parseFloat(row.target_protein),
        target_carbs: parseFloat(row.target_carbs),
        target_fat: parseFloat(row.target_fat),
        target_weight: parseFloat(row.target_weight),
        target_duration_weeks: row.target_duration_weeks,
        description: row.description,
        created_at: row.goal_created_at,
        updated_at: row.goal_updated_at,
        is_active: row.is_active
      }
    }));
  }

  async getActiveGoalsNearDeadline(userId: string, days: number = 7): Promise<UserGoalWithGoal[]> {
    const query = `
      SELECT 
        ug.*,
        g.goal_type, g.target_calories, g.target_protein, g.target_carbs,
        g.target_fat, g.target_weight, g.target_duration_weeks, 
        g.description, g.is_active,
        g.created_at as goal_created_at, g.updated_at as goal_updated_at
      FROM user_goals ug
      JOIN goals g ON ug.goal_id = g.goal_id
      WHERE ug.user_id = $1 
        AND ug.status = 'Active'
        AND ug.target_completion_date IS NOT NULL
        AND ug.target_completion_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
      ORDER BY ug.target_completion_date ASC
    `;

    const result = await this.pool.query(query, [userId]);
    
    return result.rows.map(row => ({
      user_goal_id: row.user_goal_id,
      user_id: row.user_id,
      goal_id: row.goal_id,
      assigned_date: row.assigned_date,
      target_completion_date: row.target_completion_date,
      actual_completion_date: row.actual_completion_date,
      progress_percentage: parseFloat(row.progress_percentage),
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      goal: {
        goal_id: row.goal_id,
        goal_type: row.goal_type,
        target_calories: row.target_calories,
        target_protein: parseFloat(row.target_protein),
        target_carbs: parseFloat(row.target_carbs),
        target_fat: parseFloat(row.target_fat),
        target_weight: parseFloat(row.target_weight),
        target_duration_weeks: row.target_duration_weeks,
        description: row.description,
        created_at: row.goal_created_at,
        updated_at: row.goal_updated_at,
        is_active: row.is_active
      }
    }));
  }
}