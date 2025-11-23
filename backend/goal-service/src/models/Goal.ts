import mongoose, { Schema, Document } from 'mongoose';

// Loại goal
export type GoalType =
  | 'Lose Weight'
  | 'Build Muscle'
  | 'Maintain Weight'
  | 'Improve Endurance'
  | 'General Fitness'
  | 'Reduce Fat'
  | 'Increase Endurance';

// Mongoose document interfaces
export interface IGoal extends Document {
  goal_id: string;
  goal_type: GoalType;
  description?: string;
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
  target_weight?: number;
  target_duration_weeks?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IUserGoal extends Document {
  user_goal_id: string;
  user_id: string;
  goal_id: string;
  assigned_date: Date;
  target_completion_date?: Date;
  actual_completion_date?: Date;
  progress_percentage: number;
  status: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Mongoose schemas
const goalSchema = new Schema<IGoal>({
  goal_id: { type: String, required: true, unique: true },
  goal_type: { 
    type: String, 
    required: true,
    enum: ['Lose Weight', 'Build Muscle', 'Maintain Weight', 'Improve Endurance', 'General Fitness', 'Reduce Fat', 'Increase Endurance']
  },
  description: { type: String },
  target_calories: { type: Number },
  target_protein: { type: Number },
  target_carbs: { type: Number },
  target_fat: { type: Number },
  target_weight: { type: Number },
  target_duration_weeks: { type: Number },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const userGoalSchema = new Schema<IUserGoal>({
  user_goal_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  goal_id: { type: String, required: true },
  assigned_date: { type: Date, default: Date.now },
  target_completion_date: { type: Date },
  actual_completion_date: { type: Date },
  progress_percentage: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, default: 'Active', enum: ['Active', 'Paused', 'Completed', 'Cancelled'] },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Update timestamps before save
goalSchema.pre('save', function(this: IGoal, next: () => void) {
  this.updated_at = new Date();
  next();
});

userGoalSchema.pre('save', function(this: IUserGoal, next: () => void) {
  this.updated_at = new Date();
  next();
});

// Create models
export const GoalModel = mongoose.model<IGoal>('Goal', goalSchema);
export const UserGoalModel = mongoose.model<IUserGoal>('UserGoal', userGoalSchema);

// Original interfaces for API compatibility
export interface Goal {
  goal_id: string;
  goal_type: GoalType;
  description?: string | null;

  target_calories?: number | null;
  target_protein?: number | null;
  target_carbs?: number | null;
  target_fat?: number | null;
  target_weight?: number | null;
  target_duration_weeks?: number | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===== Request/DTO cho Goal =====

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

// Gán goal cho user
export interface AssignGoalRequest {
  goal_id: string;
  target_completion_date?: string;
  notes?: string;
}

// Update user_goal
export interface UpdateUserGoalRequest {
  progress_percentage?: number;
  status?: 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  notes?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
}

// ===== Filter & phân trang =====

export interface GoalFilters {
  goal_type?: GoalType;
  is_active?: boolean;
  created_after?: Date;
  created_before?: Date;

  status?: string;
  completion_status?: 'Overdue' | 'OnTrack' | 'Ahead';
  progress_min?: number;
  progress_max?: number;
}

export interface GoalPagination {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

// ===== User goal =====

export interface UserGoal {
  user_goal_id: string;
  user_id: string;
  goal_id: string;
  assigned_date: string;
  target_completion_date?: string | null;
  actual_completion_date?: string | null;
  progress_percentage: number;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserGoalWithGoal extends UserGoal {
  goal: Goal;
}

// ===== Kết quả tìm kiếm goal =====

export interface GoalSearchResult {
  goals: UserGoalWithGoal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  total_count: number;
  current_page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

// ===== Analytics / Progress =====

export interface MonthlyGoalProgress {
  month: string;
  goals_created: number;
  goals_started: number;
  goals_completed: number;
  average_progress: number;
}

export interface DailyGoalTracking {
  date: string;
  goals_started: number;
  goals_completed: number;
  average_progress: number;
}

export interface WeeklyGoalSummary {
  week: string;
  goals_started: number;
  goals_completed: number;
  average_progress: number;
}

export interface GoalCurrentMetrics {
  days_active?: number;
  weeks_completed?: number;
  current_weight?: number;
  average_daily_calories?: number;
  average_daily_protein?: number;
  average_daily_carbs?: number;
  average_daily_fat?: number;
}

export interface GoalTargetMetrics {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  weight?: number;
  duration_weeks?: number;
}

export interface GoalProgress {
  user_goal_id: string;
  goal_type: GoalType | string;
  target_metrics: GoalTargetMetrics;
  current_metrics: GoalCurrentMetrics;
  progress_percentage: number;
  days_remaining?: number;
  estimated_completion_date?: Date;
  on_track: boolean;
}

// Tổng hợp thống kê cho user
export interface GoalStatistics {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  paused_goals: number;
  cancelled_goals: number;
  completion_rate: number;
  average_progress: number;
  average_completion_time_days?: number;
  most_common_goal_type: GoalType | string;
  goals_by_type: Record<string, number>;
  monthly_progress: MonthlyGoalProgress[];
}

// ===== Recommendation / Template =====

export interface GoalRecommendation {
  goal_type: GoalType | string;
  reason: string;
  recommended_metrics: GoalTargetMetrics;
  priority?: 'High' | 'Medium' | 'Low';
  success_probability?: number;
}

export interface GoalAdjustmentSuggestion {
  suggestion_type: 'Decrease' | 'Increase' | 'Modify Timeline' | 'Change Strategy' | string;
  reason: string;
  suggested_metrics: Partial<GoalTargetMetrics>;
}

export interface GoalTemplate {
  template_id: string;
  template_name: string;
  goal_type: GoalType | string;
  default_metrics: GoalTargetMetrics;
  description?: string;
  difficulty_level?: string;
  category?: string;
  tips?: string[];
}

export interface SmartGoalSuggestion {
  suggested_goal_type: GoalType | string;
  reason: string;
  recommended_metrics: GoalTargetMetrics;
  difficulty_level?: string;
  estimated_success_rate?: number;
}

// ===== API response =====

export interface GoalApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}