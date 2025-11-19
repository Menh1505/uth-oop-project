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
  gender?: 'Male' | 'Female' | 'Other' | null;
  age?: number | null;
  weight?: number | null; // in kg
  height?: number | null; // in cm
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string | null;
  profile_picture_url?: string | null;
  password_hash: string;
  email_verified: boolean;
  role: 'USER' | 'ADMIN' | 'STAFF';
}
