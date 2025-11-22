// backend/user-service/src/models/User.ts

// ===== User & payload cơ bản =====
// Claims bên trong access token JWT mà user-service nhận được
export interface JwtClaims {
  id: string;           // user id
  email: string;        // email
  role: string;         // 'user' | 'admin' | ...
  iat?: number;         // issued at
  exp?: number;         // expiry
  iss?: string;         // issuer
  aud?: string | string[]; // audience
  jti?: string;         // JWT ID
}
export interface User {
  user_id: string;
  name: string;
  email: string;
  password: string; // dùng cho validatePassword
  gender?: string | null;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  fitness_goal?: string | null;
  preferred_diet?: string | null;
  subscription_status?: 'Basic' | 'Premium' | string;
  payment_method?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string | null;
  email_verified?: boolean;
  profile_picture_url?: string | null;
}

// Response trả ra API (không có password)
export interface UserResponse {
  user_id: string;
  name: string;
  email: string;
  gender?: string | null;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  fitness_goal?: string | null;
  preferred_diet?: string | null;
  subscription_status?: 'Basic' | 'Premium' | string;
  payment_method?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string | null;
  email_verified?: boolean;
  profile_picture_url?: string | null;
}

// Đăng ký user
export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  gender?: string;
  age?: number;
  weight?: number;
  height?: number;
  fitness_goal?: string;
  preferred_diet?: string;
  payment_method?: string;
}

// Đăng nhập
export interface LoginUserPayload {
  email: string;
  password: string;
}

// Update profile
export interface UpdateUserProfilePayload {
  name?: string;
  gender?: string;
  age?: number;
  weight?: number;
  height?: number;
  fitness_goal?: string;
  preferred_diet?: string;
  payment_method?: string;
  profile_picture_url?: string;
}

// Onboarding dùng chung với UpdateUserProfilePayload
export interface OnboardingPayload extends UpdateUserProfilePayload {}

// ===== Địa chỉ & Preferences (cho các repository khác) =====

export interface Address {
  id: string;
  user_id: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Preferences {
  id: string;
  user_id: string;
  dietary_preferences?: string | null;
  allergies?: string | null;
  disliked_foods?: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Goal liên quan tới user (trong user-service) =====

export interface Goal {
  goal_id: string;
  goal_type: string;
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

// Payload gán goal cho user
export interface AssignGoalPayload {
  goal_id: string;
  target_completion_date?: string;
  notes?: string;
}

// Payload update user goal
export interface UpdateUserGoalPayload {
  progress_percentage?: number;
  status?: 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  notes?: string;
  target_completion_date?: string;
}