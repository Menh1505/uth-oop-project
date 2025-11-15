export interface WorkoutLog {
  id: string;
  userId: string;
  workoutPlanId?: string;
  exerciseId: string;
  date: Date;
  duration: number; // actual duration in minutes
  repsCompleted?: number;
  setsCompleted?: number;
  weightUsed?: number; // in kg
  caloriesBurned?: number;
  notes?: string;
  rating?: number; // 1-5 stars
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkoutLogRequest {
  workoutPlanId?: string;
  exerciseId: string;
  date?: Date;
  duration: number;
  repsCompleted?: number;
  setsCompleted?: number;
  weightUsed?: number;
  caloriesBurned?: number;
  notes?: string;
  rating?: number;
}

export interface UpdateWorkoutLogRequest {
  duration?: number;
  repsCompleted?: number;
  setsCompleted?: number;
  weightUsed?: number;
  caloriesBurned?: number;
  notes?: string;
  rating?: number;
}

export interface WorkoutLogSearchFilters {
  workoutPlanId?: string;
  exerciseId?: string;
  startDate?: Date;
  endDate?: Date;
  minDuration?: number;
  maxDuration?: number;
  minRating?: number;
  limit?: number;
  offset?: number;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number; // in minutes
  totalCaloriesBurned: number;
  averageRating: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  favoriteExercises: ExerciseStats[];
  progressByCategory: CategoryProgress[];
}

export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  totalSessions: number;
  totalDuration: number;
  averageRating: number;
}

export interface CategoryProgress {
  category: string;
  totalSessions: number;
  totalDuration: number;
  progressPercentage: number;
}

export interface WeeklyProgress {
  week: string; // YYYY-WW format
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  averageRating: number;
}