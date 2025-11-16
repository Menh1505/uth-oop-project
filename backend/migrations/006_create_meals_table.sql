-- Migration: Create Meals table
-- Description: User meal records

CREATE TABLE IF NOT EXISTS meals (
    meal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout')),
    meal_date DATE NOT NULL,
    meal_time TIME,
    total_calories DECIMAL(8,2) DEFAULT 0 CHECK (total_calories >= 0),
    total_protein DECIMAL(6,2) DEFAULT 0 CHECK (total_protein >= 0),
    total_carbs DECIMAL(6,2) DEFAULT 0 CHECK (total_carbs >= 0),
    total_fat DECIMAL(6,2) DEFAULT 0 CHECK (total_fat >= 0),
    total_fiber DECIMAL(6,2) DEFAULT 0 CHECK (total_fiber >= 0),
    total_sugar DECIMAL(6,2) DEFAULT 0 CHECK (total_sugar >= 0),
    meal_name VARCHAR(255),
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_meal_date ON meals(meal_date);
CREATE INDEX idx_meals_meal_type ON meals(meal_type);
CREATE INDEX idx_meals_user_date ON meals(user_id, meal_date);
CREATE INDEX idx_meals_created_at ON meals(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_meals_updated_at 
    BEFORE UPDATE ON meals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();