CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS exercises (
  exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  exercise_type VARCHAR(50) NOT NULL DEFAULT 'Other',
  duration_minutes INTEGER,
  calories_burned INTEGER,
  intensity VARCHAR(50),
  exercise_date DATE NOT NULL,
  exercise_time TIME,
  distance NUMERIC,
  sets INTEGER,
  reps INTEGER,
  weight_kg NUMERIC,
  heart_rate_avg INTEGER,
  heart_rate_max INTEGER,
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_user_date
  ON exercises (user_id, exercise_date DESC);

CREATE INDEX IF NOT EXISTS idx_exercises_user_type
  ON exercises (user_id, exercise_type);

CREATE OR REPLACE FUNCTION set_exercises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_exercises_updated_at'
  ) THEN
    CREATE TRIGGER set_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION set_exercises_updated_at();
  END IF;
END;
$$;
