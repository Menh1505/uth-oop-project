import { Request } from 'express';

export interface IUser {
  user_id: string;
  name: string;
  email: string;
  gender?: string | null;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  fitness_goal?: string | null;
  preferred_diet?: string | null;
  subscription_status: 'Basic' | 'Premium';
  last_login?: Date | null;
  profile_picture_url?: string | null;
}

export interface IGoal {
  goal_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration_weeks: number;
  target_metric: string;
  target_value: number;
  is_active: boolean;
}

export interface IUserGoal {
  user_goal_id: string;
  user_id: string;
  goal_id: string;
  goal: IGoal;
  target_value: number;
  current_value: number;
  start_date: Date;
  end_date: Date;
  status: 'Active' | 'Completed' | 'Paused';
  progress_percentage: number;
}

export interface IAICoachRequest {
  user: IUser;
  userGoals: IUserGoal[];
  question?: string;
  context?: string;
}

export interface IAICoachResponse {
  success: boolean;
  message: string;
  advice?: string;
  recommendations?: string[];
  error?: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}