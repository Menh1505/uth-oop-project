// Core Exercise interface
export interface Exercise {
  id: string;
  user_id: string;
  exercise_name: string;
  exercise_type: 'Cardio' | 'Strength' | 'Flexibility' | 'Sports' | 'Other';
  duration_minutes?: number;
  calories_burned?: number;
  intensity?: 'Low' | 'Medium' | 'High' | 'Very High';
  exercise_date: string; // YYYY-MM-DD
  exercise_time?: string; // HH:MM
  distance?: number;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  heart_rate_avg?: number;
  heart_rate_max?: number;
  notes?: string;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

// Create payload
export interface CreateExercisePayload {
  exercise_name: string;
  exercise_type: 'Cardio' | 'Strength' | 'Flexibility' | 'Sports' | 'Other';
  duration_minutes?: number;
  calories_burned?: number;
  intensity?: 'Low' | 'Medium' | 'High' | 'Very High';
  exercise_date: string;
  exercise_time?: string;
  distance?: number;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  heart_rate_avg?: number;
  heart_rate_max?: number;
  notes?: string;
  is_completed?: boolean;
}

// Update payload
export interface UpdateExercisePayload {
  exercise_name?: string;
  exercise_type?: 'Cardio' | 'Strength' | 'Flexibility' | 'Sports' | 'Other';
  duration_minutes?: number;
  calories_burned?: number;
  intensity?: 'Low' | 'Medium' | 'High' | 'Very High';
  exercise_date?: string;
  exercise_time?: string;
  distance?: number;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  heart_rate_avg?: number;
  heart_rate_max?: number;
  notes?: string;
  is_completed?: boolean;
}

// Filters
export interface ExerciseFilters {
  exercise_type?: string;
  date_from?: string;
  date_to?: string;
  min_duration?: number;
  max_duration?: number;
  min_calories?: number;
  max_calories?: number;
  intensity?: string;
  search_term?: string;
}

// Statistics
export interface ExerciseStatistics {
  total_exercises: number;
  total_duration: number;
  total_duration_minutes?: number;
  total_calories: number;
  average_intensity: string;
  most_common_type: string;
  exercise_types_breakdown: Array<{
    type: string;
    count: number;
  }>;
  weekly_summary: Array<{
    week: string;
    count: number;
    calories: number;
  }>;
  most_common_exercises: Array<{
    name: string;
    count: number;
  }>;
}

// Daily summary
export interface DailyExerciseSummary {
  date: string;
  total_exercises: number;
  total_duration: number;
  total_duration_minutes?: number;
  total_calories: number;
  exercise_types: string[];
  exercises: Exercise[];
}

// Performance metrics
export interface ExercisePerformanceMetrics {
  exercise_name: string;
  total_sessions: number;
  total_duration: number;
  average_calories_per_session: number;
  best_performance: string;
  trend: 'improving' | 'declining' | 'stable';
  performance_history: Array<{
    date: string;
    duration: number;
    calories: number;
    intensity: string;
  }>;
  progress_analysis?: any;
  recommendations?: any[];
}

// Recommendation criteria
export interface ExerciseRecommendationCriteria {
  fitness_level?: 'Beginner' | 'Intermediate' | 'Advanced';
  exercise_type?: string;
  duration_minutes?: number;
  available_equipment?: string[];
  exclude_exercises?: string[];
  previous_exercises?: string[];
  available_duration_minutes?: number;
  preferred_intensity?: string;
  equipment_available?: string[];
  user_fitness_level?: 'Beginner' | 'Intermediate' | 'Advanced';
  target_calories?: number;
  fitness_goal?: 'Reduce Fat' | 'Build Muscle' | 'General Fitness';
}

// Recommendation
export interface ExerciseRecommendation {
  exercise_name: string;
  exercise_type: string;
  recommended_duration: number;
  recommended_duration_minutes?: number;
  recommended_intensity: string;
  equipment_needed: string[];
  calories_estimate: number;
  estimated_calories_burned?: number;
  description: string;
  instructions?: string[];
  benefits: string[];
  difficulty_level?: string;
  muscle_groups?: string[];
  match_score?: number;
  recommended_sets?: number;
  recommended_reps?: number;
}

// Calorie burn factors
export interface CalorieBurnFactors {
  user_weight_kg?: number;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  fitness_level?: 'Beginner' | 'Intermediate' | 'Advanced';
}

// JWT Claims
export interface JwtClaims {
  sub: string;
  id: string;
  email: string;
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
}
