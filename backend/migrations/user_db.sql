-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- search ILIKE

-- ENUMs (tuỳ chọn: nếu muốn giữ CHECK thì bỏ phần này)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
    CREATE TYPE gender_enum AS ENUM ('male','female','other','prefer_not_to_say');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'addr_type_enum') THEN
    CREATE TYPE addr_type_enum AS ENUM ('home','work','billing','shipping');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'privacy_enum') THEN
    CREATE TYPE privacy_enum AS ENUM ('public','friends','private');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme_enum') THEN
    CREATE TYPE theme_enum AS ENUM ('light','dark','auto');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'units_enum') THEN
    CREATE TYPE units_enum AS ENUM ('metric','imperial');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_type_enum') THEN
    CREATE TYPE goal_type_enum AS ENUM ('weight_loss','muscle_gain','maintain');
  END IF;
END $$;

-- Profiles table must be created first since other tables reference it
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,                              -- = auth userId
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender gender_enum,                               -- hoặc dùng CHECK như bạn
  bio TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
  language VARCHAR(10) DEFAULT 'en' NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type addr_type_enum DEFAULT 'home' NOT NULL,
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Vietnam' NOT NULL,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User preferences (1-1)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true NOT NULL,
  push_notifications BOOLEAN DEFAULT true NOT NULL,
  sms_notifications BOOLEAN DEFAULT false NOT NULL,
  privacy_level privacy_enum DEFAULT 'public' NOT NULL,
  theme theme_enum DEFAULT 'light' NOT NULL,
  units units_enum DEFAULT 'metric' NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Processed events for tracking processed messages
CREATE TABLE IF NOT EXISTS processed_events (
  event_id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Login events with foreign key to profiles
CREATE TABLE IF NOT EXISTS login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  raw JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_events_user_time ON login_events(user_id, occurred_at DESC);

-- Fitness goals
CREATE TABLE IF NOT EXISTS fitness_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type goal_type_enum NOT NULL,
  target_value DECIMAL(8,2) CHECK (target_value IS NULL OR target_value >= 0),
  current_value DECIMAL(8,2) CHECK (current_value IS NULL OR current_value >= 0),
  unit VARCHAR(20),  -- hoặc ENUM tuỳ bài toán
  target_date DATE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON addresses(type);
CREATE INDEX IF NOT EXISTS idx_addresses_country ON addresses(country);
CREATE INDEX IF NOT EXISTS idx_fitness_goals_user_id ON fitness_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_goals_active ON fitness_goals(is_active);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fitness_goals_updated_at ON fitness_goals;
CREATE TRIGGER update_fitness_goals_updated_at BEFORE UPDATE ON fitness_goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- One default address per (user,type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_user_default
ON addresses(user_id, type) WHERE is_default = true;

-- Tự tạo user_preferences khi tạo profiles
CREATE OR REPLACE FUNCTION ensure_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences(user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_after_insert ON profiles;
CREATE TRIGGER trg_profiles_after_insert
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION ensure_user_preferences();
