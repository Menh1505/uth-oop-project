export interface User {
  id: string; // UUID
  email: string;
  password_hash: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}
