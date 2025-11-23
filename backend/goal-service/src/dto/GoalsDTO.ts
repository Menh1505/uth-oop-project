import type { GoalType } from '../models/Goal';
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
