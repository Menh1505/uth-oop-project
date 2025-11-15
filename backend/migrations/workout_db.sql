-- Create workout database migration
CREATE DATABASE workout_db;

\c workout_db;

-- Create workout_plans table
CREATE TABLE workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goal VARCHAR(50) NOT NULL CHECK (goal IN ('weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration INTEGER NOT NULL CHECK (duration > 0), -- in minutes
    frequency INTEGER NOT NULL CHECK (frequency > 0 AND frequency <= 7), -- times per week
    exercise_ids UUID[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create exercises table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('cardio', 'strength', 'flexibility', 'balance', 'sports', 'yoga', 'pilates', 'hiit')),
    muscle_groups TEXT[],
    equipment TEXT[],
    instructions TEXT[],
    video_url VARCHAR(500),
    image_url VARCHAR(500),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration INTEGER, -- in seconds for time-based exercises
    reps INTEGER, -- for rep-based exercises
    sets INTEGER,
    rest_time INTEGER, -- in seconds
    calories_per_minute DECIMAL(5,2),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create workout_logs table
CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration INTEGER NOT NULL CHECK (duration > 0), -- actual duration in minutes
    reps_completed INTEGER,
    sets_completed INTEGER,
    weight_used DECIMAL(6,2), -- in kg
    calories_burned INTEGER,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX idx_workout_plans_goal ON workout_plans(goal);
CREATE INDEX idx_workout_plans_difficulty ON workout_plans(difficulty);
CREATE INDEX idx_workout_plans_is_active ON workout_plans(is_active);
CREATE INDEX idx_workout_plans_created_at ON workout_plans(created_at);

CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercises_is_public ON exercises(is_public);
CREATE INDEX idx_exercises_muscle_groups ON exercises USING gin(muscle_groups);
CREATE INDEX idx_exercises_equipment ON exercises USING gin(equipment);
CREATE INDEX idx_exercises_search ON exercises USING gin(to_tsvector('english', name || ' ' || description));

CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_exercise_id ON workout_logs(exercise_id);
CREATE INDEX idx_workout_logs_workout_plan_id ON workout_logs(workout_plan_id);
CREATE INDEX idx_workout_logs_date ON workout_logs(date);
CREATE INDEX idx_workout_logs_rating ON workout_logs(rating);
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, date);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON workout_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_logs_updated_at BEFORE UPDATE ON workout_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample public exercises
INSERT INTO exercises (user_id, name, description, category, muscle_groups, equipment, instructions, difficulty, duration, reps, sets, rest_time, calories_per_minute, is_public) VALUES

-- Cardio exercises
('00000000-0000-0000-0000-000000000000', 'Running', 'Basic running exercise for cardiovascular fitness', 'cardio', 
 ARRAY['legs', 'core'], ARRAY['none'], 
 ARRAY['Start with a light warm-up', 'Maintain steady pace', 'Focus on breathing', 'Cool down with walking'], 
 'beginner', 1800, NULL, NULL, 60, 12.0, true),

('00000000-0000-0000-0000-000000000000', 'Jump Rope', 'High-intensity cardio exercise', 'cardio', 
 ARRAY['legs', 'arms', 'core'], ARRAY['jump rope'], 
 ARRAY['Hold rope handles', 'Jump with both feet', 'Land softly on balls of feet', 'Maintain rhythm'], 
 'intermediate', 600, NULL, NULL, 30, 15.0, true),

-- Strength exercises  
('00000000-0000-0000-0000-000000000000', 'Push-ups', 'Upper body strength exercise', 'strength', 
 ARRAY['chest', 'arms', 'shoulders', 'core'], ARRAY['none'], 
 ARRAY['Start in plank position', 'Lower body to ground', 'Push back up', 'Keep core tight'], 
 'beginner', NULL, 10, 3, 60, 8.0, true),

('00000000-0000-0000-0000-000000000000', 'Squats', 'Lower body strength exercise', 'strength', 
 ARRAY['legs', 'glutes', 'core'], ARRAY['none'], 
 ARRAY['Stand with feet shoulder-width apart', 'Lower as if sitting in chair', 'Keep knees behind toes', 'Stand back up'], 
 'beginner', NULL, 15, 3, 45, 6.0, true),

('00000000-0000-0000-0000-000000000000', 'Deadlifts', 'Full body strength exercise', 'strength', 
 ARRAY['back', 'legs', 'glutes', 'core'], ARRAY['barbell', 'weights'], 
 ARRAY['Stand with feet hip-width apart', 'Grip bar with hands shoulder-width apart', 'Lift by extending hips and knees', 'Keep back straight'], 
 'intermediate', NULL, 8, 3, 90, 10.0, true),

-- Flexibility exercises
('00000000-0000-0000-0000-000000000000', 'Downward Dog', 'Yoga pose for flexibility and strength', 'yoga', 
 ARRAY['shoulders', 'hamstrings', 'calves', 'core'], ARRAY['yoga mat'], 
 ARRAY['Start on hands and knees', 'Tuck toes under', 'Lift hips up and back', 'Straighten legs and arms'], 
 'beginner', 300, NULL, NULL, 0, 3.0, true),

('00000000-0000-0000-0000-000000000000', 'Plank', 'Core strengthening exercise', 'strength', 
 ARRAY['core', 'shoulders', 'arms'], ARRAY['none'], 
 ARRAY['Start in push-up position', 'Hold body straight', 'Keep core engaged', 'Breathe normally'], 
 'beginner', 60, NULL, NULL, 0, 5.0, true),

-- HIIT exercises
('00000000-0000-0000-0000-000000000000', 'Burpees', 'Full body HIIT exercise', 'hiit', 
 ARRAY['full body'], ARRAY['none'], 
 ARRAY['Start standing', 'Drop to squat', 'Jump back to plank', 'Do push-up', 'Jump forward', 'Jump up with arms overhead'], 
 'advanced', NULL, 10, 3, 30, 18.0, true),

('00000000-0000-0000-0000-000000000000', 'Mountain Climbers', 'Cardio and core exercise', 'hiit', 
 ARRAY['core', 'legs', 'arms'], ARRAY['none'], 
 ARRAY['Start in plank position', 'Bring one knee to chest', 'Switch legs quickly', 'Keep core engaged'], 
 'intermediate', 300, NULL, NULL, 15, 12.0, true),

-- Balance exercises
('00000000-0000-0000-0000-000000000000', 'Single Leg Stand', 'Balance and stability exercise', 'balance', 
 ARRAY['legs', 'core'], ARRAY['none'], 
 ARRAY['Stand on one leg', 'Keep other leg lifted', 'Maintain balance', 'Switch legs'], 
 'beginner', 180, NULL, NULL, 0, 2.0, true);

-- Insert sample workout plans (using system user)
INSERT INTO workout_plans (user_id, name, description, goal, difficulty, duration, frequency, exercise_ids) VALUES

('00000000-0000-0000-0000-000000000000', 'Beginner Full Body', 'Complete beginner workout plan targeting all muscle groups', 'general_fitness', 'beginner', 45, 3, 
 (SELECT ARRAY_AGG(id) FROM exercises WHERE difficulty = 'beginner' AND is_public = true LIMIT 5)),

('00000000-0000-0000-0000-000000000000', 'Weight Loss Cardio', 'High-intensity cardio plan for weight loss', 'weight_loss', 'intermediate', 30, 5, 
 (SELECT ARRAY_AGG(id) FROM exercises WHERE category IN ('cardio', 'hiit') AND is_public = true LIMIT 4)),

('00000000-0000-0000-0000-000000000000', 'Strength Builder', 'Muscle building plan with compound movements', 'muscle_gain', 'intermediate', 60, 4, 
 (SELECT ARRAY_AGG(id) FROM exercises WHERE category = 'strength' AND is_public = true LIMIT 4));

COMMIT;