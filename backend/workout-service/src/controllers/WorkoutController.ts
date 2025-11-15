import { Request, Response } from 'express';
import { WorkoutService } from '../services/WorkoutService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class WorkoutController {
  private workoutService: WorkoutService;

  constructor() {
    this.workoutService = new WorkoutService();
  }

  // ============= WORKOUT PLANS =============
  
  getUserWorkoutPlans = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const filters = {
        goal: req.query.goal as any,
        difficulty: req.query.difficulty as any,
        maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration as string) : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const workoutPlans = await this.workoutService.getUserWorkoutPlans(userId, filters);
      
      res.json({
        success: true,
        data: workoutPlans,
        count: workoutPlans.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get workout plans',
        message: error.message
      });
    }
  };

  getWorkoutPlan = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const workoutPlan = await this.workoutService.getWorkoutPlanById(id, userId);
      
      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Workout plan not found'
        });
      }

      res.json({
        success: true,
        data: workoutPlan
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get workout plan',
        message: error.message
      });
    }
  };

  createWorkoutPlan = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const workoutPlanData = req.body;

      const workoutPlan = await this.workoutService.createWorkoutPlan(userId, workoutPlanData);
      
      res.status(201).json({
        success: true,
        data: workoutPlan,
        message: 'Workout plan created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create workout plan',
        message: error.message
      });
    }
  };

  updateWorkoutPlan = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updateData = req.body;

      const workoutPlan = await this.workoutService.updateWorkoutPlan(id, userId, updateData);
      
      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Workout plan not found'
        });
      }

      res.json({
        success: true,
        data: workoutPlan,
        message: 'Workout plan updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update workout plan',
        message: error.message
      });
    }
  };

  deleteWorkoutPlan = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const deleted = await this.workoutService.deleteWorkoutPlan(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Workout plan not found'
        });
      }

      res.json({
        success: true,
        message: 'Workout plan deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete workout plan',
        message: error.message
      });
    }
  };

  // ============= EXERCISES =============
  
  getUserExercises = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const filters = {
        category: req.query.category as any,
        difficulty: req.query.difficulty as any,
        muscleGroup: req.query.muscleGroup as string,
        equipment: req.query.equipment as string,
        isPublic: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
        maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration as string) : undefined,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const exercises = await this.workoutService.getUserExercises(userId, filters);
      
      res.json({
        success: true,
        data: exercises,
        count: exercises.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get exercises',
        message: error.message
      });
    }
  };

  getExercise = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const exercise = await this.workoutService.getExerciseById(id, userId);
      
      if (!exercise) {
        return res.status(404).json({
          success: false,
          error: 'Exercise not found'
        });
      }

      res.json({
        success: true,
        data: exercise
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get exercise',
        message: error.message
      });
    }
  };

  createExercise = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const exerciseData = req.body;

      const exercise = await this.workoutService.createExercise(userId, exerciseData);
      
      res.status(201).json({
        success: true,
        data: exercise,
        message: 'Exercise created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create exercise',
        message: error.message
      });
    }
  };

  updateExercise = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updateData = req.body;

      const exercise = await this.workoutService.updateExercise(id, userId, updateData);
      
      if (!exercise) {
        return res.status(404).json({
          success: false,
          error: 'Exercise not found or not owned by user'
        });
      }

      res.json({
        success: true,
        data: exercise,
        message: 'Exercise updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update exercise',
        message: error.message
      });
    }
  };

  deleteExercise = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const deleted = await this.workoutService.deleteExercise(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Exercise not found or not owned by user'
        });
      }

      res.json({
        success: true,
        message: 'Exercise deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete exercise',
        message: error.message
      });
    }
  };

  // ============= WORKOUT LOGS =============
  
  getUserWorkoutLogs = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const filters = {
        workoutPlanId: req.query.workoutPlanId as string,
        exerciseId: req.query.exerciseId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        minDuration: req.query.minDuration ? parseInt(req.query.minDuration as string) : undefined,
        maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration as string) : undefined,
        minRating: req.query.minRating ? parseInt(req.query.minRating as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const workoutLogs = await this.workoutService.getUserWorkoutLogs(userId, filters);
      
      res.json({
        success: true,
        data: workoutLogs,
        count: workoutLogs.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get workout logs',
        message: error.message
      });
    }
  };

  getWorkoutLog = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const workoutLog = await this.workoutService.getWorkoutLogById(id, userId);
      
      if (!workoutLog) {
        return res.status(404).json({
          success: false,
          error: 'Workout log not found'
        });
      }

      res.json({
        success: true,
        data: workoutLog
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get workout log',
        message: error.message
      });
    }
  };

  createWorkoutLog = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const logData = req.body;

      const workoutLog = await this.workoutService.createWorkoutLog(userId, logData);
      
      res.status(201).json({
        success: true,
        data: workoutLog,
        message: 'Workout log created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create workout log',
        message: error.message
      });
    }
  };

  updateWorkoutLog = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updateData = req.body;

      const workoutLog = await this.workoutService.updateWorkoutLog(id, userId, updateData);
      
      if (!workoutLog) {
        return res.status(404).json({
          success: false,
          error: 'Workout log not found'
        });
      }

      res.json({
        success: true,
        data: workoutLog,
        message: 'Workout log updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update workout log',
        message: error.message
      });
    }
  };

  deleteWorkoutLog = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const deleted = await this.workoutService.deleteWorkoutLog(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Workout log not found'
        });
      }

      res.json({
        success: true,
        message: 'Workout log deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete workout log',
        message: error.message
      });
    }
  };

  // ============= STATS & ANALYTICS =============
  
  getUserStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      const stats = await this.workoutService.getUserWorkoutStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get workout stats',
        message: error.message
      });
    }
  };

  // ============= HEALTH CHECK =============
  
  healthCheck = async (req: Request, res: Response) => {
    res.json({
      service: 'workout-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  };
}