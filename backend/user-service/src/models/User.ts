export interface JwtClaims {
  id: string;     // auth user id (UUID)
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Main User interface matching the users table in database
export interface User {
  user_id: string;
  name: string;
  email: string;
  password: string;
  gender?: 'Male' | 'Female' | 'Other' | null;
  age?: number | null;
  weight?: number | null; // in kg
  height?: number | null; // in cm
  fitness_goal?: 'Reduce Fat' | 'Build Muscle' | 'Maintain Weight' | 'General Fitness' | null;
  preferred_diet?: 'None' | 'Vegetarian' | 'Vegan' | 'Keto' | 'Mediterranean' | 'Low Carb' | 'High Protein' | null;
  subscription_status: 'Basic' | 'Premium';
  payment_method?: 'Apple Pay' | 'PayOS' | 'Credit Card' | 'Bank Transfer' | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string | null;
  email_verified: boolean;
  profile_picture_url?: string | null;
}

// User registration payload
export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  weight?: number;
  height?: number;
  fitness_goal?: 'Reduce Fat' | 'Build Muscle' | 'Maintain Weight' | 'General Fitness';
  preferred_diet?: 'None' | 'Vegetarian' | 'Vegan' | 'Keto' | 'Mediterranean' | 'Low Carb' | 'High Protein';
  payment_method?: 'Apple Pay' | 'PayOS' | 'Credit Card' | 'Bank Transfer';
}

// User profile update payload (excluding sensitive fields)
export interface UpdateUserProfilePayload {
  name?: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  weight?: number;
  height?: number;
  fitness_goal?: 'Reduce Fat' | 'Build Muscle' | 'Maintain Weight' | 'General Fitness';
  preferred_diet?: 'None' | 'Vegetarian' | 'Vegan' | 'Keto' | 'Mediterranean' | 'Low Carb' | 'High Protein';
  payment_method?: 'Apple Pay' | 'PayOS' | 'Credit Card' | 'Bank Transfer';
  profile_picture_url?: string;
}

// User login payload
export interface LoginUserPayload {
  email: string;
  password: string;
}

// User response (without password)
export interface UserResponse extends Omit<User, 'password'> {}

// Goal interface
export interface Goal {
  goal_id: string;
  goal_type: 'Reduce Fat' | 'Build Muscle' | 'Maintain Weight' | 'Increase Endurance' | 'General Fitness';
  target_calories?: number | null;
  target_protein?: number | null; // in grams
  target_carbs?: number | null; // in grams
  target_fat?: number | null; // in grams
  target_weight?: number | null; // in kg
  target_duration_weeks?: number | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// User Goals relationship
export interface UserGoal {
  user_goal_id: string;
  user_id: string;
  goal_id: string;
  assigned_date: string;
  target_completion_date?: string | null;
  actual_completion_date?: string | null;
  progress_percentage: number;
  status: 'Active' | 'Completed' | 'Paused' | 'Cancelled';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// User Goal assignment payload
export interface AssignGoalPayload {
  goal_id: string;
  target_completion_date?: string;
  notes?: string;
}

// Update user goal payload
export interface UpdateUserGoalPayload {
  progress_percentage?: number;
  status?: 'Active' | 'Completed' | 'Paused' | 'Cancelled';
  notes?: string;
  target_completion_date?: string;
}

// Onboarding payload for new users
export interface OnboardingPayload {
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  weight?: number;
  height?: number;
  fitness_goal?: 'Reduce Fat' | 'Build Muscle' | 'Maintain Weight' | 'General Fitness';
  preferred_diet?: 'None' | 'Vegetarian' | 'Vegan' | 'Keto' | 'Mediterranean' | 'Low Carb' | 'High Protein';
  payment_method?: 'Apple Pay' | 'PayOS' | 'Credit Card' | 'Bank Transfer';
}

// Legacy interfaces for backwards compatibility
export interface Profile {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: 'male'|'female'|'other'|'prefer_not_to_say' | null;
  bio?: string | null;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
}

export interface Address {
  id: string;
  user_id: string;
  type: 'home'|'work'|'billing'|'shipping';
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Preferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  privacy_level: 'public'|'friends'|'private';
  units: 'metric'|'imperial';
  theme: 'light'|'dark'|'auto';
  created_at: string;
  updated_at: string;
}

export type CreateProfilePayload = Partial<Omit<Profile, 'id'|'created_at'|'updated_at'>>;
export type UpdateProfilePayload = CreateProfilePayload;