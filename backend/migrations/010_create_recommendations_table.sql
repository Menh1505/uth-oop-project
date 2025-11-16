-- Migration: Create Recommendations table
-- Description: Personalized recommendations for users

CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recommendation_type VARCHAR(20) NOT NULL CHECK (recommendation_type IN ('Meal', 'Exercise', 'Goal', 'Nutrition', 'Recipe')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1 = highest priority
    category VARCHAR(50),
    target_goal VARCHAR(50), -- Related fitness goal
    calories_impact INTEGER, -- Expected calorie impact
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
    estimated_duration_minutes INTEGER,
    tags TEXT[], -- Array of tags for categorization
    image_url VARCHAR(500),
    external_link VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    is_liked BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    engagement_score DECIMAL(3,2) DEFAULT 0.00, -- For recommendation algorithm
    generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB, -- Additional recommendation data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_type ON recommendations(recommendation_type);
CREATE INDEX idx_recommendations_priority ON recommendations(priority);
CREATE INDEX idx_recommendations_generated_date ON recommendations(generated_date);
CREATE INDEX idx_recommendations_is_read ON recommendations(is_read);
CREATE INDEX idx_recommendations_is_dismissed ON recommendations(is_dismissed);
CREATE INDEX idx_recommendations_expires_at ON recommendations(expires_at);
CREATE INDEX idx_recommendations_target_goal ON recommendations(target_goal);

-- Create trigger for updated_at
CREATE TRIGGER update_recommendations_updated_at 
    BEFORE UPDATE ON recommendations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();