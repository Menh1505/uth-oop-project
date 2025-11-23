import { Pool } from 'pg';
import { 
  Exercise, 
  CreateExercisePayload, 
  UpdateExercisePayload, 
  ExerciseFilters,
  ExerciseStatistics,
  DailyExerciseSummary,
  ExercisePerformanceMetrics
} from '../models/Exercise';
import pool from '../config/database';

export class ExerciseRepository {
  private static pool: Pool = pool;

  // Create new exercise
  static async create(userId: string, exerciseData: CreateExercisePayload): Promise<Exercise> {
    const query = `
      INSERT INTO exercises (
        user_id, exercise_name, exercise_type, duration_minutes, calories_burned,
        intensity, exercise_date, exercise_time, distance, sets, reps, weight_kg,
        heart_rate_avg, heart_rate_max, notes, is_completed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      userId,
      exerciseData.exercise_name,
      exerciseData.exercise_type,
      exerciseData.duration_minutes || null,
      exerciseData.calories_burned || null,
      exerciseData.intensity || null,
      exerciseData.exercise_date,
      exerciseData.exercise_time || null,
      exerciseData.distance || null,
      exerciseData.sets || null,
      exerciseData.reps || null,
      exerciseData.weight_kg || null,
      exerciseData.heart_rate_avg || null,
      exerciseData.heart_rate_max || null,
      exerciseData.notes || null,
      exerciseData.is_completed ?? true
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Get exercise by ID
  static async findById(exerciseId: string): Promise<Exercise | null> {
    const query = 'SELECT * FROM exercises WHERE exercise_id = $1';
    const result = await this.pool.query(query, [exerciseId]);
    return result.rows[0] || null;
  }

  // Get user exercises with filters
  static async getUserExercises(
    userId: string, 
    filters: ExerciseFilters = {}, 
    limit = 50, 
    offset = 0
  ): Promise<Exercise[]> {
    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [userId];
    let paramIndex = 2;

    // Apply filters
    if (filters.exercise_type) {
      conditions.push(`exercise_type = $${paramIndex}`);
      values.push(filters.exercise_type);
      paramIndex++;
    }

    if (filters.intensity) {
      conditions.push(`intensity = $${paramIndex}`);
      values.push(filters.intensity);
      paramIndex++;
    }

    if (filters.min_duration) {
      conditions.push(`duration_minutes >= $${paramIndex}`);
      values.push(filters.min_duration);
      paramIndex++;
    }

    if (filters.max_duration) {
      conditions.push(`duration_minutes <= $${paramIndex}`);
      values.push(filters.max_duration);
      paramIndex++;
    }

    if (filters.min_calories) {
      conditions.push(`calories_burned >= $${paramIndex}`);
      values.push(filters.min_calories);
      paramIndex++;
    }

    if (filters.max_calories) {
      conditions.push(`calories_burned <= $${paramIndex}`);
      values.push(filters.max_calories);
      paramIndex++;
    }

    if (filters.date_from) {
      conditions.push(`exercise_date >= $${paramIndex}`);
      values.push(filters.date_from);
      paramIndex++;
    }

    if (filters.date_to) {
      conditions.push(`exercise_date <= $${paramIndex}`);
      values.push(filters.date_to);
      paramIndex++;
    }

    if (filters.search_term) {
      conditions.push(`exercise_name ILIKE $${paramIndex}`);
      values.push(`%${filters.search_term}%`);
      paramIndex++;
    }

    values.push(limit, offset);

    const query = `
      SELECT * FROM exercises 
      WHERE ${conditions.join(' AND ')}
      ORDER BY exercise_date DESC, exercise_time DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  // Get exercises by date
  static async getUserExercisesByDate(userId: string, date: string): Promise<Exercise[]> {
    const query = `
      SELECT * FROM exercises 
      WHERE user_id = $1 AND exercise_date = $2
      ORDER BY exercise_time ASC, created_at ASC
    `;
    const result = await this.pool.query(query, [userId, date]);
    return result.rows;
  }

  // Get exercises by date range
  static async getUserExercisesByDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<Exercise[]> {
    const query = `
      SELECT * FROM exercises 
      WHERE user_id = $1 AND exercise_date BETWEEN $2 AND $3
      ORDER BY exercise_date DESC, exercise_time ASC, created_at ASC
    `;
    const result = await this.pool.query(query, [userId, startDate, endDate]);
    return result.rows;
  }

  // Update exercise
  static async update(exerciseId: string, updateData: UpdateExercisePayload): Promise<Exercise> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(exerciseId);

    const query = `
      UPDATE exercises 
      SET ${updateFields.join(', ')}
      WHERE exercise_id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Exercise not found');
    }
    return result.rows[0];
  }

  // Delete exercise
  static async delete(exerciseId: string): Promise<void> {
    const query = 'DELETE FROM exercises WHERE exercise_id = $1';
    await this.pool.query(query, [exerciseId]);
  }

  // Check if user owns the exercise
  static async isUserExercise(userId: string, exerciseId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM exercises WHERE exercise_id = $1 AND user_id = $2';
    const result = await this.pool.query(query, [exerciseId, userId]);
    return result.rows.length > 0;
  }

  // Get exercise statistics for user
  static async getUserExerciseStatistics(
    userId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<ExerciseStatistics> {
    const dateCondition = startDate && endDate 
      ? 'AND exercise_date BETWEEN $2 AND $3' 
      : '';
    const params = startDate && endDate 
      ? [userId, startDate, endDate] 
      : [userId];

    // Basic statistics
    const basicStatsQuery = `
      SELECT 
        COUNT(*) as total_exercises,
        COALESCE(SUM(duration_minutes), 0) as total_duration_minutes,
        COALESCE(SUM(calories_burned), 0) as total_calories_burned,
        COALESCE(AVG(duration_minutes), 0) as average_duration,
        COALESCE(AVG(calories_burned), 0) as average_calories_per_exercise
      FROM exercises 
      WHERE user_id = $1 ${dateCondition}
    `;
    const basicStatsResult = await this.pool.query(basicStatsQuery, params);
    const basicStats = basicStatsResult.rows[0];

    // Exercise types breakdown
    const typesQuery = `
      SELECT 
        exercise_type as type,
        COUNT(*) as count,
        COALESCE(SUM(calories_burned), 0) as total_calories,
        COALESCE(SUM(duration_minutes), 0) as total_duration
      FROM exercises 
      WHERE user_id = $1 ${dateCondition}
      GROUP BY exercise_type
      ORDER BY count DESC
    `;
    const typesResult = await this.pool.query(typesQuery, params);

    // Weekly summary (last 8 weeks)
    const weeklyQuery = `
      SELECT 
        DATE_TRUNC('week', exercise_date) as week_start,
        COUNT(*) as exercise_count,
        COALESCE(SUM(calories_burned), 0) as total_calories,
        COALESCE(SUM(duration_minutes), 0) as total_duration
      FROM exercises 
      WHERE user_id = $1 
        AND exercise_date >= CURRENT_DATE - INTERVAL '8 weeks'
        ${dateCondition}
      GROUP BY DATE_TRUNC('week', exercise_date)
      ORDER BY week_start DESC
    `;
    const weeklyResult = await this.pool.query(weeklyQuery, params);

    // Most common exercises
    const commonExercisesQuery = `
      SELECT 
        exercise_name,
        COUNT(*) as count,
        COALESCE(SUM(calories_burned), 0) as total_calories,
        COALESCE(AVG(calories_burned), 0) as average_calories
      FROM exercises 
      WHERE user_id = $1 ${dateCondition}
      GROUP BY exercise_name
      ORDER BY count DESC
      LIMIT 10
    `;
    const commonExercisesResult = await this.pool.query(commonExercisesQuery, params);

    return {
      total_exercises: parseInt(basicStats.total_exercises),
      total_duration: parseFloat(basicStats.total_duration_minutes),
      total_duration_minutes: parseFloat(basicStats.total_duration_minutes),
      total_calories: parseFloat(basicStats.total_calories_burned),
      average_intensity: 'Medium',
      most_common_type: 'General',
      exercise_types_breakdown: typesResult.rows.map((row: any) => ({
        type: row.exercise_type,
        count: row.count
      })),
      weekly_summary: weeklyResult.rows.map((row: any) => ({
        week: row.week,
        count: row.count,
        calories: row.total_calories
      })),
      most_common_exercises: commonExercisesResult.rows.map((row: any) => ({
        name: row.exercise_name,
        count: row.count
      }))
    };
  }

  // Get daily exercise summary
  static async getDailyExerciseSummary(userId: string, date: string): Promise<DailyExerciseSummary> {
    const exercises = await this.getUserExercisesByDate(userId, date);

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_exercises,
        COALESCE(SUM(duration_minutes), 0) as total_duration_minutes,
        COALESCE(SUM(calories_burned), 0) as total_calories_burned,
        ARRAY_AGG(DISTINCT exercise_type) as exercise_types,
        AVG(CASE 
          WHEN intensity = 'Low' THEN 1
          WHEN intensity = 'Medium' THEN 2
          WHEN intensity = 'High' THEN 3
          WHEN intensity = 'Very High' THEN 4
          ELSE 2
        END) as avg_intensity_score
      FROM exercises 
      WHERE user_id = $1 AND exercise_date = $2
    `;
    const summaryResult = await this.pool.query(summaryQuery, [userId, date]);
    const summary = summaryResult.rows[0];

    const intensityScore = parseFloat(summary.avg_intensity_score || '2');
    let averageIntensity = 'Medium';
    if (intensityScore <= 1.5) averageIntensity = 'Low';
    else if (intensityScore <= 2.5) averageIntensity = 'Medium';
    else if (intensityScore <= 3.5) averageIntensity = 'High';
    else averageIntensity = 'Very High';

    return {
      date,
      exercises,
      total_exercises: parseInt(summary.total_exercises),
      total_duration: parseFloat(summary.total_duration_minutes),
      total_duration_minutes: parseFloat(summary.total_duration_minutes),
      total_calories: parseFloat(summary.total_calories_burned),
      exercise_types: summary.exercise_types || []
    };
  }

  // Get exercise performance metrics
  static async getExercisePerformanceMetrics(
    userId: string, 
    exerciseName: string
  ): Promise<ExercisePerformanceMetrics> {
    const historyQuery = `
      SELECT 
        exercise_date as date,
        duration_minutes,
        calories_burned,
        distance,
        sets,
        reps,
        weight_kg,
        heart_rate_avg,
        intensity
      FROM exercises 
      WHERE user_id = $1 AND exercise_name = $2
      ORDER BY exercise_date DESC, created_at DESC
      LIMIT 50
    `;
    const historyResult = await this.pool.query(historyQuery, [userId, exerciseName]);

    const performance_history = historyResult.rows.map((row: any) => ({
      date: row.exercise_date,
      duration: row.duration_minutes,
      calories: row.calories_burned,
      sets: row.sets,
      reps: row.reps,
      weight_kg: row.weight_kg,
      heart_rate_avg: row.heart_rate_avg,
      intensity: row.intensity || 'Medium'
    }));

    // Calculate trends and best performance
    const progress_analysis = this.calculateProgressAnalysis(performance_history);

    return {
      exercise_name: exerciseName,
      total_sessions: performance_history.length,
      total_duration: performance_history.reduce((sum: number, h: any) => sum + (h.duration || 0), 0),
      average_calories_per_session: performance_history.length > 0 ? Math.round(performance_history.reduce((sum: number, h: any) => sum + (h.calories || 0), 0) / performance_history.length) : 0,
      best_performance: 'Unknown',
      trend: 'stable' as const,
      performance_history,
      progress_analysis,
      recommendations: this.generatePerformanceRecommendations(progress_analysis)
    };
  }

  // Get popular exercises
  static async getPopularExercises(limit = 20): Promise<{exercise_name: string; usage_count: number}[]> {
    const query = `
      SELECT 
        exercise_name,
        COUNT(*) as usage_count
      FROM exercises 
      GROUP BY exercise_name
      ORDER BY usage_count DESC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows.map((row: any) => ({
      exercise_name: row.exercise_name,
      usage_count: parseInt(row.usage_count)
    }));
  }

  // Helper method to calculate progress analysis
  private static calculateProgressAnalysis(history: any[]): any {
    if (history.length < 2) {
      return {
        duration_trend: 'Stable',
        calories_trend: 'Stable',
        strength_trend: 'Stable',
        endurance_trend: 'Stable',
        improvement_percentage: 0,
        best_performance: null
      };
    }

    const recent = history.slice(0, Math.min(5, history.length));
    const older = history.slice(Math.max(0, history.length - 5));

    // Calculate trends
    const recentAvgDuration = recent.reduce((sum, h) => sum + (h.duration_minutes || 0), 0) / recent.length;
    const olderAvgDuration = older.reduce((sum, h) => sum + (h.duration_minutes || 0), 0) / older.length;
    
    const recentAvgCalories = recent.reduce((sum, h) => sum + (h.calories_burned || 0), 0) / recent.length;
    const olderAvgCalories = older.reduce((sum, h) => sum + (h.calories_burned || 0), 0) / older.length;

    const recentAvgWeight = recent.reduce((sum, h) => sum + (h.weight_kg || 0), 0) / recent.length;
    const olderAvgWeight = older.reduce((sum, h) => sum + (h.weight_kg || 0), 0) / older.length;

    const getDurationTrend = () => {
      const diff = recentAvgDuration - olderAvgDuration;
      if (Math.abs(diff) < 2) return 'Stable';
      return diff > 0 ? 'Increasing' : 'Decreasing';
    };

    const getCaloriesTrend = () => {
      const diff = recentAvgCalories - olderAvgCalories;
      if (Math.abs(diff) < 10) return 'Stable';
      return diff > 0 ? 'Increasing' : 'Decreasing';
    };

    const getStrengthTrend = () => {
      const diff = recentAvgWeight - olderAvgWeight;
      if (Math.abs(diff) < 1) return 'Stable';
      return diff > 0 ? 'Increasing' : 'Decreasing';
    };

    // Find best performance
    let bestPerformance = null;
    let bestValue = 0;
    let bestMetric = '';

    for (const h of history) {
      if (h.weight_kg && h.weight_kg > bestValue) {
        bestValue = h.weight_kg;
        bestMetric = 'weight_kg';
        bestPerformance = { date: h.date, metric: 'Weight (kg)', value: h.weight_kg };
      }
      if (h.distance && h.distance > bestValue) {
        bestValue = h.distance;
        bestMetric = 'distance';
        bestPerformance = { date: h.date, metric: 'Distance (km)', value: h.distance };
      }
      if (h.calories_burned && h.calories_burned > bestValue) {
        bestValue = h.calories_burned;
        bestMetric = 'calories';
        bestPerformance = { date: h.date, metric: 'Calories Burned', value: h.calories_burned };
      }
    }

    // Calculate improvement percentage
    const improvementPercentage = olderAvgCalories > 0 
      ? ((recentAvgCalories - olderAvgCalories) / olderAvgCalories) * 100 
      : 0;

    return {
      duration_trend: getDurationTrend(),
      calories_trend: getCaloriesTrend(),
      strength_trend: getStrengthTrend(),
      endurance_trend: getCaloriesTrend(), // Using calories as proxy for endurance
      improvement_percentage: Math.round(improvementPercentage * 100) / 100,
      best_performance: bestPerformance
    };
  }

  // Helper method to generate performance recommendations
  private static generatePerformanceRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.duration_trend === 'Decreasing') {
      recommendations.push('Consider gradually increasing exercise duration to maintain endurance');
    }

    if (analysis.calories_trend === 'Decreasing') {
      recommendations.push('Try increasing exercise intensity or duration to maintain calorie burn');
    }

    if (analysis.strength_trend === 'Stable' && analysis.best_performance?.metric.includes('Weight')) {
      recommendations.push('Consider progressive overload by gradually increasing weight');
    }

    if (analysis.improvement_percentage < 0) {
      recommendations.push('Focus on consistent training schedule and proper recovery');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great progress! Keep maintaining your current routine');
    }

    return recommendations;
  }
}
