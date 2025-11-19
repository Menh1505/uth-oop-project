-- Create users table as reference to auth.users
-- This allows user-service to query user data without cross-database joins
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  gender VARCHAR(50),
  age INTEGER,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  fitness_goal VARCHAR(100),
  preferred_diet VARCHAR(100),
  subscription_status VARCHAR(50) DEFAULT 'free',
  payment_method VARCHAR(100),
  last_login TIMESTAMP,
  email_verified BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for quick lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Create trigger function for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

