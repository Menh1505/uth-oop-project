export interface Exercise {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  muscleGroups: string[];
  equipment: string[];
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
  difficulty: DifficultyLevel;
  duration?: number; // in seconds for time-based exercises
  reps?: number; // for rep-based exercises
  sets?: number;
  restTime?: number; // in seconds
  caloriesPerMinute?: number;
  isPublic: boolean; // false = personal exercise, true = shared
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExerciseRequest {
  name: string;
  description: string;
  category: ExerciseCategory;
  muscleGroups: string[];
  equipment: string[];
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
  difficulty: DifficultyLevel;
  duration?: number;
  reps?: number;
  sets?: number;
  restTime?: number;
  caloriesPerMinute?: number;
  isPublic?: boolean;
}

export interface UpdateExerciseRequest {
  name?: string;
  description?: string;
  category?: ExerciseCategory;
  muscleGroups?: string[];
  equipment?: string[];
  instructions?: string[];
  videoUrl?: string;
  imageUrl?: string;
  difficulty?: DifficultyLevel;
  duration?: number;
  reps?: number;
  sets?: number;
  restTime?: number;
  caloriesPerMinute?: number;
  isPublic?: boolean;
}

export enum ExerciseCategory {
  CARDIO = 'cardio',
  STRENGTH = 'strength',
  FLEXIBILITY = 'flexibility',
  BALANCE = 'balance',
  SPORTS = 'sports',
  YOGA = 'yoga',
  PILATES = 'pilates',
  HIIT = 'hiit'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export interface ExerciseSearchFilters {
  category?: ExerciseCategory;
  difficulty?: DifficultyLevel;
  muscleGroup?: string;
  equipment?: string;
  isPublic?: boolean;
  maxDuration?: number;
  search?: string;
  limit?: number;
  offset?: number;
}