export type AuthUserRecord = {
  id: string;
  email: string;
  username: string | null;
  password_hash: string;
  status: string;
};

export type CachedAuthUserPayload = {
  user: AuthUserRecord;
  roles: string[];
  cachedAt: string;
};
