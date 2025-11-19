-- Sync users from auth.users_auth to user_db.users after registration
-- This migration is run in user_db to keep users table in sync

-- First, sync any existing users from auth database (if cross-db access available)
-- For now, just ensure the users table has the right structure

-- Add trigger on users table to auto-create profile when user is inserted
CREATE OR REPLACE FUNCTION sync_user_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user is inserted, create a corresponding profile in profiles table
  INSERT INTO profiles (id, full_name, created_at, updated_at)
  VALUES (NEW.user_id, COALESCE(NEW.name, 'User'), NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.name, 'User'),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_user_to_profiles_trigger ON users;
CREATE TRIGGER sync_user_to_profiles_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_to_profiles();
