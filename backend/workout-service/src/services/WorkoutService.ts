import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { 
  WorkoutPlan, 
  CreateWorkoutPlanRequest, 
  UpdateWorkoutPlanRequest,
  WorkoutPlanSearchFilters 
} from '../models/WorkoutPlan';
import { 
  Exercise, 
  CreateExerciseRequest, 
  UpdateExerciseRequest,
  ExerciseSearchFilters 
} from '../models/Exercise';
import { 
  WorkoutLog, 
  CreateWorkoutLogRequest, 
  UpdateWorkoutLogRequest,
  WorkoutLogSearchFilters,
  WorkoutStats
} from '../models/WorkoutLog';

export class WorkoutService {
  
  // ============= WORKOUT PLANS =============
  
  async getUserWorkoutPlans(userId: string, filters: WorkoutPlanSearchFilters = {}): Promise<WorkoutPlan[]> {
    try {
      let query = `
        SELECT * FROM workout_plans 
        WHERE user_id = $1
      `;
      const values: any[] = [userId];
      let paramCount = 1;

      if (filters.goal) {
        query += ` AND goal = $${++paramCount}`;
        values.push(filters.goal);
      }

      if (filters.difficulty) {
        query += ` AND difficulty = $${++paramCount}`;
        values.push(filters.difficulty);
      }

      if (filters.maxDuration) {
        query += ` AND duration <= $${++paramCount}`;
        values.push(filters.maxDuration);
      }

      if (filters.isActive !== undefined) {
        query += ` AND is_active = $${++paramCount}`;
        values.push(filters.isActive);
      }

      query += ` ORDER BY created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`;
        values.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${++paramCount}`;
        values.push(filters.offset);
      }

      const result = await pool.query(query, values);
      return result.rows.map(this.mapRowToWorkoutPlan);
    } catch (error) {
      throw error;
    }
  }

  async getWorkoutPlanById(id: string, userId: string): Promise<WorkoutPlan | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM workout_plans WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToWorkoutPlan(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async createWorkoutPlan(userId: string, data: CreateWorkoutPlanRequest): Promise<WorkoutPlan> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const result = await pool.query(`
        INSERT INTO workout_plans (
          id, user_id, name, description, goal, difficulty, 
          duration, frequency, exercise_ids, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        id, userId, data.name, data.description, data.goal, data.difficulty,
        data.duration, data.frequency, data.exerciseIds, true, now, now
      ]);

      return this.mapRowToWorkoutPlan(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async updateWorkoutPlan(id: string, userId: string, data: UpdateWorkoutPlanRequest): Promise<WorkoutPlan | null> {
    try {
      const existing = await this.getWorkoutPlanById(id, userId);
      if (!existing) {
        return null;
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const fieldsToUpdate = [
        'name', 'description', 'goal', 'difficulty', 
        'duration', 'frequency', 'exerciseIds', 'isActive'
      ];

      fieldsToUpdate.forEach(field => {
        const dbField = field === 'exerciseIds' ? 'exercise_ids' : 
                       field === 'isActive' ? 'is_active' :
                       field.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (data[field as keyof UpdateWorkoutPlanRequest] !== undefined) {
          updateFields.push(`${dbField} = $${++paramCount}`);
          values.push(data[field as keyof UpdateWorkoutPlanRequest]);
        }
      });

      if (updateFields.length === 0) {
        return existing;
      }

      updateFields.push(`updated_at = $${++paramCount}`);
      values.push(new Date());
      values.push(id);
      values.push(userId);

      const result = await pool.query(`
        UPDATE workout_plans SET ${updateFields.join(', ')} 
        WHERE id = $${++paramCount} AND user_id = $${++paramCount}
        RETURNING *
      `, values);

      return this.mapRowToWorkoutPlan(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async deleteWorkoutPlan(id: string, userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM workout_plans WHERE id = $1 AND user_id = $2', 
        [id, userId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // ============= EXERCISES =============
  
  async getUserExercises(userId: string, filters: ExerciseSearchFilters = {}): Promise<Exercise[]> {
    try {
      let query = `
        SELECT * FROM exercises 
        WHERE (user_id = $1 OR is_public = true)
      `;
      const values: any[] = [userId];
      let paramCount = 1;

      if (filters.category) {
        query += ` AND category = $${++paramCount}`;
        values.push(filters.category);
      }

      if (filters.difficulty) {
        query += ` AND difficulty = $${++paramCount}`;
        values.push(filters.difficulty);
      }

      if (filters.muscleGroup) {
        query += ` AND $${++paramCount} = ANY(muscle_groups)`;
        values.push(filters.muscleGroup);
      }

      if (filters.equipment) {
        query += ` AND $${++paramCount} = ANY(equipment)`;
        values.push(filters.equipment);
      }

      if (filters.isPublic !== undefined) {
        query += ` AND is_public = $${++paramCount}`;
        values.push(filters.isPublic);
      }

      if (filters.maxDuration) {
        query += ` AND duration <= $${++paramCount}`;
        values.push(filters.maxDuration);
      }

      if (filters.search) {
        query += ` AND (name ILIKE $${++paramCount} OR description ILIKE $${++paramCount})`;
        values.push(`%${filters.search}%`, `%${filters.search}%`);
        paramCount++;
      }

      query += ` ORDER BY created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`;
        values.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${++paramCount}`;
        values.push(filters.offset);
      }

      const result = await pool.query(query, values);
      return result.rows.map(this.mapRowToExercise);
    } catch (error) {
      throw error;
    }
  }

  async getExerciseById(id: string, userId: string): Promise<Exercise | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM exercises WHERE id = $1 AND (user_id = $2 OR is_public = true)',
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToExercise(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async createExercise(userId: string, data: CreateExerciseRequest): Promise<Exercise> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const result = await pool.query(`
        INSERT INTO exercises (
          id, user_id, name, description, category, muscle_groups, equipment,
          instructions, video_url, image_url, difficulty, duration, reps, sets,
          rest_time, calories_per_minute, is_public, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `, [
        id, userId, data.name, data.description, data.category, data.muscleGroups,
        data.equipment, data.instructions, data.videoUrl, data.imageUrl,
        data.difficulty, data.duration, data.reps, data.sets, data.restTime,
        data.caloriesPerMinute, data.isPublic || false, now, now
      ]);

      return this.mapRowToExercise(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async updateExercise(id: string, userId: string, data: UpdateExerciseRequest): Promise<Exercise | null> {
    try {
      // Only allow updating own exercises
      const existing = await pool.query(
        'SELECT * FROM exercises WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (existing.rows.length === 0) {
        return null;
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const fieldsToUpdate = [
        'name', 'description', 'category', 'muscleGroups', 'equipment',
        'instructions', 'videoUrl', 'imageUrl', 'difficulty', 'duration',
        'reps', 'sets', 'restTime', 'caloriesPerMinute', 'isPublic'
      ];

      fieldsToUpdate.forEach(field => {
        const dbField = field === 'muscleGroups' ? 'muscle_groups' :
                       field === 'videoUrl' ? 'video_url' :
                       field === 'imageUrl' ? 'image_url' :
                       field === 'restTime' ? 'rest_time' :
                       field === 'caloriesPerMinute' ? 'calories_per_minute' :
                       field === 'isPublic' ? 'is_public' :
                       field.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (data[field as keyof UpdateExerciseRequest] !== undefined) {
          updateFields.push(`${dbField} = $${++paramCount}`);
          values.push(data[field as keyof UpdateExerciseRequest]);
        }
      });

      if (updateFields.length === 0) {
        return this.mapRowToExercise(existing.rows[0]);
      }

      updateFields.push(`updated_at = $${++paramCount}`);
      values.push(new Date());
      values.push(id);
      values.push(userId);

      const result = await pool.query(`
        UPDATE exercises SET ${updateFields.join(', ')} 
        WHERE id = $${++paramCount} AND user_id = $${++paramCount}
        RETURNING *
      `, values);

      return this.mapRowToExercise(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async deleteExercise(id: string, userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM exercises WHERE id = $1 AND user_id = $2', 
        [id, userId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // ============= WORKOUT LOGS =============
  
  async getUserWorkoutLogs(userId: string, filters: WorkoutLogSearchFilters = {}): Promise<WorkoutLog[]> {
    try {
      let query = `
        SELECT wl.*, e.name as exercise_name, wp.name as workout_plan_name
        FROM workout_logs wl
        LEFT JOIN exercises e ON wl.exercise_id = e.id
        LEFT JOIN workout_plans wp ON wl.workout_plan_id = wp.id
        WHERE wl.user_id = $1
      `;
      const values: any[] = [userId];
      let paramCount = 1;

      if (filters.workoutPlanId) {
        query += ` AND wl.workout_plan_id = $${++paramCount}`;
        values.push(filters.workoutPlanId);
      }

      if (filters.exerciseId) {
        query += ` AND wl.exercise_id = $${++paramCount}`;
        values.push(filters.exerciseId);
      }

      if (filters.startDate) {
        query += ` AND wl.date >= $${++paramCount}`;
        values.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND wl.date <= $${++paramCount}`;
        values.push(filters.endDate);
      }

      if (filters.minDuration) {
        query += ` AND wl.duration >= $${++paramCount}`;
        values.push(filters.minDuration);
      }

      if (filters.maxDuration) {
        query += ` AND wl.duration <= $${++paramCount}`;
        values.push(filters.maxDuration);
      }

      if (filters.minRating) {
        query += ` AND wl.rating >= $${++paramCount}`;
        values.push(filters.minRating);
      }

      query += ` ORDER BY wl.date DESC, wl.created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`;
        values.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${++paramCount}`;
        values.push(filters.offset);
      }

      const result = await pool.query(query, values);
      return result.rows.map(this.mapRowToWorkoutLog);
    } catch (error) {
      throw error;
    }
  }

  async getWorkoutLogById(id: string, userId: string): Promise<WorkoutLog | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM workout_logs WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToWorkoutLog(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async createWorkoutLog(userId: string, data: CreateWorkoutLogRequest): Promise<WorkoutLog> {
    try {
      const id = uuidv4();
      const now = new Date();
      const logDate = data.date || now;
      
      const result = await pool.query(`
        INSERT INTO workout_logs (
          id, user_id, workout_plan_id, exercise_id, date, duration,
          reps_completed, sets_completed, weight_used, calories_burned,
          notes, rating, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        id, userId, data.workoutPlanId, data.exerciseId, logDate, data.duration,
        data.repsCompleted, data.setsCompleted, data.weightUsed, data.caloriesBurned,
        data.notes, data.rating, now, now
      ]);

      return this.mapRowToWorkoutLog(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async updateWorkoutLog(id: string, userId: string, data: UpdateWorkoutLogRequest): Promise<WorkoutLog | null> {
    try {
      const existing = await this.getWorkoutLogById(id, userId);
      if (!existing) {
        return null;
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const fieldsToUpdate = [
        'duration', 'repsCompleted', 'setsCompleted', 'weightUsed',
        'caloriesBurned', 'notes', 'rating'
      ];

      fieldsToUpdate.forEach(field => {
        const dbField = field === 'repsCompleted' ? 'reps_completed' :
                       field === 'setsCompleted' ? 'sets_completed' :
                       field === 'weightUsed' ? 'weight_used' :
                       field === 'caloriesBurned' ? 'calories_burned' :
                       field.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (data[field as keyof UpdateWorkoutLogRequest] !== undefined) {
          updateFields.push(`${dbField} = $${++paramCount}`);
          values.push(data[field as keyof UpdateWorkoutLogRequest]);
        }
      });

      if (updateFields.length === 0) {
        return existing;
      }

      updateFields.push(`updated_at = $${++paramCount}`);
      values.push(new Date());
      values.push(id);
      values.push(userId);

      const result = await pool.query(`
        UPDATE workout_logs SET ${updateFields.join(', ')} 
        WHERE id = $${++paramCount} AND user_id = $${++paramCount}
        RETURNING *
      `, values);

      return this.mapRowToWorkoutLog(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async deleteWorkoutLog(id: string, userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM workout_logs WHERE id = $1 AND user_id = $2', 
        [id, userId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // ============= STATS & ANALYTICS =============
  
  async getUserWorkoutStats(userId: string): Promise<WorkoutStats> {
    try {
      // Get basic stats
      const statsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_workouts,
          SUM(duration) as total_duration,
          SUM(calories_burned) as total_calories_burned,
          AVG(rating) as average_rating,
          COUNT(CASE WHEN date >= NOW() - INTERVAL '7 days' THEN 1 END) as workouts_this_week,
          COUNT(CASE WHEN date >= NOW() - INTERVAL '30 days' THEN 1 END) as workouts_this_month
        FROM workout_logs 
        WHERE user_id = $1
      `, [userId]);

      const stats = statsResult.rows[0];

      // Get favorite exercises
      const favExercisesResult = await pool.query(`
        SELECT 
          wl.exercise_id,
          e.name as exercise_name,
          COUNT(*) as total_sessions,
          SUM(wl.duration) as total_duration,
          AVG(wl.rating) as average_rating
        FROM workout_logs wl
        JOIN exercises e ON wl.exercise_id = e.id
        WHERE wl.user_id = $1
        GROUP BY wl.exercise_id, e.name
        ORDER BY total_sessions DESC, average_rating DESC
        LIMIT 5
      `, [userId]);

      return {
        totalWorkouts: parseInt(stats.total_workouts) || 0,
        totalDuration: parseFloat(stats.total_duration) || 0,
        totalCaloriesBurned: parseFloat(stats.total_calories_burned) || 0,
        averageRating: parseFloat(stats.average_rating) || 0,
        workoutsThisWeek: parseInt(stats.workouts_this_week) || 0,
        workoutsThisMonth: parseInt(stats.workouts_this_month) || 0,
        favoriteExercises: favExercisesResult.rows.map(row => ({
          exerciseId: row.exercise_id,
          exerciseName: row.exercise_name,
          totalSessions: parseInt(row.total_sessions),
          totalDuration: parseFloat(row.total_duration),
          averageRating: parseFloat(row.average_rating)
        })),
        progressByCategory: [] // Could be implemented later
      };
    } catch (error) {
      throw error;
    }
  }

  // ============= HELPER METHODS =============
  
  private mapRowToWorkoutPlan(row: any): WorkoutPlan {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      goal: row.goal,
      difficulty: row.difficulty,
      duration: row.duration,
      frequency: row.frequency,
      exerciseIds: row.exercise_ids || [],
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToExercise(row: any): Exercise {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      category: row.category,
      muscleGroups: row.muscle_groups || [],
      equipment: row.equipment || [],
      instructions: row.instructions || [],
      videoUrl: row.video_url,
      imageUrl: row.image_url,
      difficulty: row.difficulty,
      duration: row.duration,
      reps: row.reps,
      sets: row.sets,
      restTime: row.rest_time,
      caloriesPerMinute: row.calories_per_minute,
      isPublic: row.is_public,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToWorkoutLog(row: any): WorkoutLog {
    return {
      id: row.id,
      userId: row.user_id,
      workoutPlanId: row.workout_plan_id,
      exerciseId: row.exercise_id,
      date: row.date,
      duration: row.duration,
      repsCompleted: row.reps_completed,
      setsCompleted: row.sets_completed,
      weightUsed: row.weight_used,
      caloriesBurned: row.calories_burned,
      notes: row.notes,
      rating: row.rating,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}