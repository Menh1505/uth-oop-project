import mongoose, { Document, Schema } from 'mongoose';

// ===== Mongoose Schemas & Interfaces =====

export interface IUser extends Document {
  user_id: string;
  name: string;
  email: string;
  password: string;
  gender?: string | null;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  fitness_goal?: string | null;
  preferred_diet?: string | null;
  subscription_status: 'Basic' | 'Premium';
  payment_method?: string | null;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  last_login?: Date | null;
  email_verified?: boolean;
  profile_picture_url?: string | null;
}

const UserSchema = new Schema<IUser>({
  user_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', null],
    default: null
  },
  age: {
    type: Number,
    min: 0,
    max: 150,
    default: null
  },
  weight: {
    type: Number,
    min: 0,
    default: null
  },
  height: {
    type: Number,
    min: 0,
    default: null
  },
  fitness_goal: {
    type: String,
    default: null
  },
  preferred_diet: {
    type: String,
    default: null
  },
  subscription_status: {
    type: String,
    enum: ['Basic', 'Premium'],
    default: 'Basic'
  },
  payment_method: {
    type: String,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date,
    default: null
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  profile_picture_url: {
    type: String,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ user_id: 1 });
UserSchema.index({ is_active: 1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);

// Address Schema
export interface IAddress extends Document {
  user_id: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  created_at: Date;
  updated_at: Date;
}

const AddressSchema = new Schema<IAddress>({
  user_id: {
    type: String,
    required: true
  },
  street: String,
  city: String,
  state: String,
  country: String,
  postal_code: String
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

AddressSchema.index({ user_id: 1 });

export const AddressModel = mongoose.model<IAddress>('Address', AddressSchema);

// Preferences Schema
export interface IPreferences extends Document {
  user_id: string;
  dietary_preferences?: string | null;
  allergies?: string | null;
  disliked_foods?: string | null;
  created_at: Date;
  updated_at: Date;
}

const PreferencesSchema = new Schema<IPreferences>({
  user_id: {
    type: String,
    required: true,
    unique: true
  },
  dietary_preferences: String,
  allergies: String,
  disliked_foods: String
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

PreferencesSchema.index({ user_id: 1 });

export const PreferencesModel = mongoose.model<IPreferences>('Preferences', PreferencesSchema);

// Goal Schema
export interface IGoal extends Document {
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
  created_at: Date;
  updated_at: Date;
}

const GoalSchema = new Schema<IGoal>({
  goal_id: {
    type: String,
    required: true,
    unique: true
  },
  goal_type: {
    type: String,
    required: true
  },
  description: String,
  target_calories: Number,
  target_protein: Number,
  target_carbs: Number,
  target_fat: Number,
  target_weight: Number,
  target_duration_weeks: Number,
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

GoalSchema.index({ goal_type: 1 });
GoalSchema.index({ is_active: 1 });

export const GoalModel = mongoose.model<IGoal>('Goal', GoalSchema);

// UserGoal Schema
export interface IUserGoal extends Document {
  user_goal_id: string;
  user_id: string;
  goal_id: string;
  assigned_date: Date;
  target_completion_date?: Date | null;
  actual_completion_date?: Date | null;
  progress_percentage: number;
  status: 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

const UserGoalSchema = new Schema<IUserGoal>({
  user_goal_id: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: String,
    required: true
  },
  goal_id: {
    type: String,
    required: true
  },
  assigned_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  target_completion_date: Date,
  actual_completion_date: Date,
  progress_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  notes: String
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

UserGoalSchema.index({ user_id: 1 });
UserGoalSchema.index({ goal_id: 1 });
UserGoalSchema.index({ status: 1 });

export const UserGoalModel = mongoose.model<IUserGoal>('UserGoal', UserGoalSchema);

// ===== TypeScript Interfaces (cho API) =====

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
  bmi?: number | null;
  bmi_category?: string | null;
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
