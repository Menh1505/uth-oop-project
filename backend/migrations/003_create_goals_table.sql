-- Migration: Create Goals table
-- Description: Fitness goals and targets

CREATE TABLE IF NOT EXISTS goals (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('Reduce Fat', 'Build Muscle', 'Maintain Weight', 'Increase Endurance', 'General Fitness')),
    target_calories INTEGER CHECK (target_calories > 0),
    target_protein DECIMAL(6,2) CHECK (target_protein >= 0), -- in grams
    target_carbs DECIMAL(6,2) CHECK (target_carbs >= 0), -- in grams
    target_fat DECIMAL(6,2) CHECK (target_fat >= 0), -- in grams
    target_weight DECIMAL(5,2) CHECK (target_weight > 0), -- in kg
    target_duration_weeks INTEGER CHECK (target_duration_weeks > 0),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_goals_goal_type ON goals(goal_type);
CREATE INDEX idx_goals_is_active ON goals(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();