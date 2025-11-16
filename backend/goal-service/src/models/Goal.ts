// Goal Type enum
export type GoalType = 'Weight Loss' | 'Weight Gain' | 'Fitness' | 'Nutrition' | 'Habit' | 'Health' | 'Other' | 'Reduce Fat' | 'Build Muscle' | 'Maintain Weight' | 'Increase Endurance' | 'General Fitness';

// Goal interface
export interface Goal {
  goal_id: string;
  goal_type: GoalType;
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
  target_weight?: number;
  target_duration_weeks?: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// User Goal (assignment of goal to user)
export interface UserGoal {
  user_goal_id: string;
  user_id: string;
  goal_id: string;
  assigned_date: string | Date;
  target_completion_date?: string | Date;
  actual_completion_date?: string | Date;
  progress_percentage: number;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// User Goal with Goal details
export interface UserGoalWithGoal extends UserGoal {
  id?: string;
  last_updated?: string;
  goal?: Goal;
}

// Create Goal Request
export interface CreateGoalRequest {
  goal_type: GoalType;
  description?: string;
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
  target_weight?: number;
  target_duration_weeks?: number;
}

// Update Goal Request
export interface UpdateGoalRequest {
  goal_type?: GoalType;
  description?: string;
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
  target_weight?: number;
  target_duration_weeks?: number;
  is_active?: boolean;
}

// Assign Goal Request
export interface AssignGoalRequest {
  goal_id: string;
  user_id: string;
  target_completion_date?: string;
  notes?: string;
}

// Update User Goal Request
export interface UpdateUserGoalRequest {
  progress_percentage?: number;
  status?: string;
  actual_completion_date?: string;
}

// Goal Filters
export interface GoalFilters {
  goal_type?: GoalType;
  is_active?: boolean;
  created_after?: string | Date;
  created_before?: string | Date;
  completion_status?: string;
  progress_min?: number;
  progress_max?: number;
  status?: string;
}

// Goal Pagination
export interface GoalPagination {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: string;
  total?: number;
  total_pages?: number;
}

// Goal Search Result
export interface GoalSearchResult {
  goals: UserGoalWithGoal[];
  pagination: GoalPagination;
  total_count?: number;
  current_page?: number;
  total_pages?: number;
  has_next?: boolean;
  has_previous?: boolean;
}

// Goal Target Metrics
export interface GoalTargetMetrics {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  weight?: number;
  duration_weeks?: number;
}

// Goal Statistics
export interface GoalStatistics {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  paused_goals: number;
  cancelled_goals?: number;
  completion_rate: number;
  average_progress: number;
  most_common_goal_type?: GoalType;
  average_completion_time_days?: number;
  goals_by_type?: Record<string, number>;
  monthly_progress?: MonthlyGoalProgress[];
}

// Goal Progress
export interface GoalProgress {
  user_goal_id?: string;
  goal_id?: string;
  goal_type?: GoalType;
  progress_percentage: number;
  on_track: boolean;
  days_remaining?: number;
  target_metrics?: GoalTargetMetrics;
  current_metrics?: GoalCurrentMetrics;
  estimated_completion_date?: string | Date;
}

// Goal Recommendation
export interface GoalRecommendation {
  goal_type: GoalType;
  reason: string;
  success_rate?: number;
  priority?: 'High' | 'Medium' | 'Low';
  success_probability?: number;
  recommended_metrics?: GoalTargetMetrics;
}

// Goal Adjustment Suggestion
export interface GoalAdjustmentSuggestion {
  suggestion_type: string;
  reason: string;
  suggested_metrics: Partial<GoalTargetMetrics>;
}

// Goal Current Metrics
export interface GoalCurrentMetrics {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  weight?: number;
  current_weight?: number;
  days_active?: number;
  weeks_completed?: number;
  average_daily_calories?: number;
  average_daily_protein?: number;
  average_daily_carbs?: number;
  average_daily_fat?: number;
}

// Daily Goal Tracking
export interface DailyGoalTracking {
  tracking_date: string;
  goals_met: number;
  goals_total: number;
  adherence_rate: number;
}

// Weekly Goal Summary
export interface WeeklyGoalSummary {
  week_start: string;
  week_end: string;
  goals_completed: number;
  average_progress: number;
  days_on_track: number;
}

// Monthly Goal Progress
export interface MonthlyGoalProgress {
  month: string;
  goals_created: number;
  goals_started?: number;
  goals_completed: number;
  average_completion_time?: number;
  average_progress?: number;
  most_common_type?: GoalType;
}

// Goal Template
export interface GoalTemplate {
  template_id: string;
  template_name: string;
  goal_type: GoalType;
  description: string;
  default_metrics: GoalTargetMetrics;
  difficulty_level: 'Easy' | 'Medium' | 'Hard';
  category: string;
  tips: string[];
}

// Smart Goal Suggestion
export interface SmartGoalSuggestion {
  suggested_goal_type: GoalType;
  reason: string;
  recommended_metrics: GoalTargetMetrics;
  difficulty_level: 'Easy' | 'Medium' | 'Hard';
  estimated_success_rate: number;
}

// JWT Claims
export interface JwtClaims {
  sub: string;
  id: string;
  aud?: string;
}

// API Response wrapper
export interface GoalApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string | Date;
}
