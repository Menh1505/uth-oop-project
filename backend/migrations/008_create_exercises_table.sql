-- Migration: Create Exercises table
-- Description: Exercise records for users

CREATE TABLE IF NOT EXISTS exercises (
    exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    exercise_name VARCHAR(255) NOT NULL,
    exercise_type VARCHAR(50) CHECK (exercise_type IN ('Cardio', 'Strength', 'Flexibility', 'Sports', 'Other')),
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    calories_burned DECIMAL(8,2) CHECK (calories_burned >= 0),
    intensity VARCHAR(20) CHECK (intensity IN ('Low', 'Medium', 'High', 'Very High')),
    exercise_date DATE NOT NULL,
    exercise_time TIME,
    distance DECIMAL(8,2), -- For cardio exercises (km)
    sets INTEGER, -- For strength exercises
    reps INTEGER, -- For strength exercises
    weight_kg DECIMAL(6,2), -- For strength exercises
    heart_rate_avg INTEGER, -- Average heart rate during exercise
    heart_rate_max INTEGER, -- Maximum heart rate during exercise
    notes TEXT,
    is_completed BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_exercises_exercise_date ON exercises(exercise_date);
CREATE INDEX idx_exercises_exercise_type ON exercises(exercise_type);
CREATE INDEX idx_exercises_exercise_name ON exercises(exercise_name);
CREATE INDEX idx_exercises_user_date ON exercises(user_id, exercise_date);
CREATE INDEX idx_exercises_calories_burned ON exercises(calories_burned);

-- Create trigger for updated_at
CREATE TRIGGER update_exercises_updated_at 
    BEFORE UPDATE ON exercises 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();