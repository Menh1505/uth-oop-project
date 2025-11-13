export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  goal: WorkoutGoal;
  difficulty: DifficultyLevel;
  duration: number; // in minutes
  frequency: number; // times per week
  exerciseIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkoutPlanRequest {
  name: string;
  description: string;
  goal: WorkoutGoal;
  difficulty: DifficultyLevel;
  duration: number;
  frequency: number;
  exerciseIds: string[];
}

export interface UpdateWorkoutPlanRequest {
  name?: string;
  description?: string;
  goal?: WorkoutGoal;
  difficulty?: DifficultyLevel;
  duration?: number;
  frequency?: number;
  exerciseIds?: string[];
  isActive?: boolean;
}

export enum WorkoutGoal {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  ENDURANCE = 'endurance',
  STRENGTH = 'strength',
  FLEXIBILITY = 'flexibility',
  GENERAL_FITNESS = 'general_fitness'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export interface WorkoutPlanSearchFilters {
  goal?: WorkoutGoal;
  difficulty?: DifficultyLevel;
  maxDuration?: number;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}