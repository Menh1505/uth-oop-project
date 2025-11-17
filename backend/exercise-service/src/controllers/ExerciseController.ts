import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { ExerciseService } from '../services/ExerciseService';

export class ExerciseController {
  // Health check
  static async status(_req: AuthRequest, res: Response) {
    res.json({
      service: 'exercise-service',
      status: 'healthy',
      version: '1.0.0',
      database: process.env.DB_NAME || 'exercise_db',
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /exercises',
        'GET /exercises/:exerciseId',
        'PUT /exercises/:exerciseId',
        'DELETE /exercises/:exerciseId',
        'GET /exercises',
        'GET /exercises/date/:date',
        'GET /exercises/range/:startDate/:endDate',
        'GET /exercises/statistics',
        'GET /exercises/daily-summary/:date',
        'GET /exercises/performance/:exerciseName',
        'POST /exercises/recommendations',
        'GET /exercises/popular'
      ]
    });
  }

  // Create new exercise
  static async createExercise(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const exerciseData = req.body;
      const exercise = await ExerciseService.createExercise(userId, exerciseData);
      
      res.status(201).json({
        success: true,
        message: 'Exercise created successfully',
        exercise
      });
    } catch (error: any) {
      console.error('Create exercise error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create exercise',
        error: error.message
      });
    }
  }

  // Get exercise by ID
  static async getExercise(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { exerciseId } = req.params;
      const exercise = await ExerciseService.getExerciseById(userId, exerciseId);
      
      if (!exercise) {
        return res.status(404).json({
          success: false,
          message: 'Exercise not found'
        });
      }

      res.json({
        success: true,
        exercise
      });
    } catch (error: any) {
      console.error('Get exercise error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exercise',
        error: error.message
      });
    }
  }

  // Update exercise
  static async updateExercise(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { exerciseId } = req.params;
      const updateData = req.body;
      
      const exercise = await ExerciseService.updateExercise(userId, exerciseId, updateData);
      
      res.json({
        success: true,
        message: 'Exercise updated successfully',
        exercise
      });
    } catch (error: any) {
      console.error('Update exercise error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update exercise',
        error: error.message
      });
    }
  }

  // Delete exercise
  static async deleteExercise(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { exerciseId } = req.params;
      await ExerciseService.deleteExercise(userId, exerciseId);
      
      res.json({
        success: true,
        message: 'Exercise deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete exercise error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete exercise',
        error: error.message
      });
    }
  }

  // Get exercises with filters
  static async getExercises(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const {
        exercise_type,
        intensity,
        min_duration,
        max_duration,
        min_calories,
        max_calories,
        date_from,
        date_to,
        search_term,
        limit = '50',
        offset = '0'
      } = req.query;

      const filters = {
        exercise_type: exercise_type as any,
        intensity: intensity as any,
        min_duration: min_duration ? parseInt(min_duration as string) : undefined,
        max_duration: max_duration ? parseInt(max_duration as string) : undefined,
        min_calories: min_calories ? parseFloat(min_calories as string) : undefined,
        max_calories: max_calories ? parseFloat(max_calories as string) : undefined,
        date_from: date_from as string,
        date_to: date_to as string,
        search_term: search_term as string
      };

      // Clean up filters - remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const exercises = await ExerciseService.getUserExercises(
        userId, 
        filters, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      
      res.json({
        success: true,
        exercises,
        count: exercises.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
    } catch (error: any) {
      console.error('Get exercises error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch exercises',
        error: error.message
      });
    }
  }

  // Get exercises by date
  static async getExercisesByDate(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { date } = req.params;
      const exercises = await ExerciseService.getExercisesByDate(userId, date);
      
      res.json({
        success: true,
        date,
        exercises,
        count: exercises.length
      });
    } catch (error: any) {
      console.error('Get exercises by date error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch exercises',
        error: error.message
      });
    }
  }

  // Get exercises by date range
  static async getExercisesByDateRange(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { startDate, endDate } = req.params;
      const exercises = await ExerciseService.getExercisesByDateRange(userId, startDate, endDate);
      
      res.json({
        success: true,
        startDate,
        endDate,
        exercises,
        count: exercises.length
      });
    } catch (error: any) {
      console.error('Get exercises by date range error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch exercises',
        error: error.message
      });
    }
  }

  // Get exercise statistics
  static async getExerciseStatistics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { startDate, endDate } = req.query;
      const statistics = await ExerciseService.getExerciseStatistics(
        userId, 
        startDate as string, 
        endDate as string
      );
      
      res.json({
        success: true,
        statistics,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        }
      });
    } catch (error: any) {
      console.error('Get exercise statistics error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch exercise statistics',
        error: error.message
      });
    }
  }

  // Get daily exercise summary
  static async getDailyExerciseSummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { date } = req.params;
      const summary = await ExerciseService.getDailyExerciseSummary(userId, date);
      
      res.json({
        success: true,
        summary
      });
    } catch (error: any) {
      console.error('Get daily exercise summary error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch daily exercise summary',
        error: error.message
      });
    }
  }

  // Get exercise performance metrics
  static async getExercisePerformanceMetrics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const { exerciseName } = req.params;
      const metrics = await ExerciseService.getExercisePerformanceMetrics(userId, exerciseName);
      
      res.json({
        success: true,
        metrics
      });
    } catch (error: any) {
      console.error('Get exercise performance metrics error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch exercise performance metrics',
        error: error.message
      });
    }
  }

  // Get exercise recommendations
  static async getExerciseRecommendations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const criteria = req.body;
      const recommendations = await ExerciseService.getExerciseRecommendations(userId, criteria);
      
      res.json({
        success: true,
        recommendations,
        count: recommendations.length
      });
    } catch (error: any) {
      console.error('Get exercise recommendations error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get exercise recommendations',
        error: error.message
      });
    }
  }

  // Get popular exercises
  static async getPopularExercises(req: AuthRequest, res: Response) {
    try {
      const exercises = await ExerciseService.getPopularExercises();
      
      res.json({
        success: true,
        exercises,
        count: exercises.length
      });
    } catch (error: any) {
      console.error('Get popular exercises error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popular exercises',
        error: error.message
      });
    }
  }

  // Estimate calories for exercise
  static async estimateCalories(req: AuthRequest, res: Response) {
    try {
      const { exercise_type, duration_minutes, intensity, user_weight_kg, age, gender, fitness_level } = req.body;

      if (!exercise_type || !duration_minutes || !intensity || !user_weight_kg) {
        return res.status(400).json({
          success: false,
          message: 'exercise_type, duration_minutes, intensity, and user_weight_kg are required'
        });
      }

      const estimatedCalories = await ExerciseService.estimateCaloriesBurned(
        exercise_type,
        duration_minutes,
        intensity,
        { user_weight_kg, age, gender, fitness_level }
      );
      
      res.json({
        success: true,
        estimated_calories: estimatedCalories,
        factors: {
          exercise_type,
          duration_minutes,
          intensity,
          user_weight_kg,
          age,
          gender,
          fitness_level
        }
      });
    } catch (error: any) {
      console.error('Estimate calories error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to estimate calories',
        error: error.message
      });
    }
  }
}