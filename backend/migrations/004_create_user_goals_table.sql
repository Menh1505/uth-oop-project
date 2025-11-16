-- Migration: Create User Goals junction table
-- Description: Many-to-many relationship between users and goals

CREATE TABLE IF NOT EXISTS user_goals (
    user_goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(goal_id) ON DELETE CASCADE,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    target_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Paused', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_goal_id ON user_goals(goal_id);
CREATE INDEX idx_user_goals_status ON user_goals(status);
CREATE INDEX idx_user_goals_assigned_date ON user_goals(assigned_date);

-- Create unique constraint to prevent duplicate active goals for same user
CREATE UNIQUE INDEX idx_user_goals_unique_active 
ON user_goals(user_id, goal_id) 
WHERE status = 'Active';

-- Create trigger for updated_at
CREATE TRIGGER update_user_goals_updated_at 
    BEFORE UPDATE ON user_goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();