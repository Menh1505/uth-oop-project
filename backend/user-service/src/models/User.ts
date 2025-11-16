export interface JwtClaims {
  id: string;     // auth user id (UUID)
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

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
  last_login?: string | null; // cột tùy chọn
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
  theme: 'light'|'dark'|'auto';
  units: 'metric'|'imperial';
  created_at: string;
  updated_at: string;
}

export type CreateProfilePayload = Partial<Omit<Profile, 'id'|'created_at'|'updated_at'>>;
export type UpdateProfilePayload = CreateProfilePayload;
