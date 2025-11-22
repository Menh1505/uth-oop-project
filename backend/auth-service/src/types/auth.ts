export type AuthUserRecord = {
  _id: any;
  email: string;
  username: string | null;
  password_hash: string;
  status: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
};

export type CachedAuthUserPayload = {
  user: AuthUserRecord;
  roles: string[];
  cachedAt: string;
};
