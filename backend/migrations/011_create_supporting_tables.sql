-- Migration: Create additional supporting tables
-- Description: Create supporting tables for better data management

-- User Preferences table for detailed dietary and fitness preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    dietary_restrictions TEXT[], -- Array of dietary restrictions
    allergies TEXT[], -- Array of food allergies
    disliked_foods TEXT[], -- Array of disliked foods
    preferred_cuisines TEXT[], -- Array of preferred cuisines
    meal_frequency INTEGER DEFAULT 3 CHECK (meal_frequency >= 1 AND meal_frequency <= 10),
    preferred_workout_times TEXT[], -- Array like ['Morning', 'Evening']
    workout_frequency_per_week INTEGER CHECK (workout_frequency_per_week >= 0 AND workout_frequency_per_week <= 14),
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Exercise Templates table for pre-defined exercises
CREATE TABLE IF NOT EXISTS exercise_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_name VARCHAR(255) NOT NULL,
    exercise_type VARCHAR(50) NOT NULL CHECK (exercise_type IN ('Cardio', 'Strength', 'Flexibility', 'Sports', 'Other')),
    description TEXT,
    instructions TEXT,
    muscle_groups TEXT[], -- Array of muscle groups targeted
    equipment_required TEXT[], -- Array of equipment needed
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
    calories_per_minute DECIMAL(4,2), -- Average calories burned per minute
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nutrition Logs for daily nutrition summary
CREATE TABLE IF NOT EXISTS nutrition_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    total_calories DECIMAL(8,2) DEFAULT 0,
    total_protein DECIMAL(6,2) DEFAULT 0,
    total_carbs DECIMAL(6,2) DEFAULT 0,
    total_fat DECIMAL(6,2) DEFAULT 0,
    total_fiber DECIMAL(6,2) DEFAULT 0,
    total_sugar DECIMAL(6,2) DEFAULT 0,
    water_intake_ml INTEGER DEFAULT 0,
    calories_burned DECIMAL(8,2) DEFAULT 0,
    net_calories DECIMAL(8,2) DEFAULT 0, -- total_calories - calories_burned
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, log_date)
);

-- User Progress Tracking
CREATE TABLE IF NOT EXISTS user_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL,
    weight_kg DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,2),
    muscle_mass_kg DECIMAL(5,2),
    body_measurements JSONB, -- Store various body measurements
    progress_photos TEXT[], -- Array of photo URLs
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for new tables
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_exercise_templates_exercise_type ON exercise_templates(exercise_type);
CREATE INDEX idx_exercise_templates_difficulty ON exercise_templates(difficulty_level);
CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs(user_id, log_date);
CREATE INDEX idx_nutrition_logs_log_date ON nutrition_logs(log_date);
CREATE INDEX idx_user_progress_user_date ON user_progress(user_id, recorded_date);
CREATE INDEX idx_user_progress_recorded_date ON user_progress(recorded_date);

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_templates_updated_at 
    BEFORE UPDATE ON exercise_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_logs_updated_at 
    BEFORE UPDATE ON nutrition_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at 
    BEFORE UPDATE ON user_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();