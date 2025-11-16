-- Migration: Create Users table
-- Description: Main users table with authentication and profile information

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    age INTEGER CHECK (age > 0 AND age < 150),
    weight DECIMAL(5,2) CHECK (weight > 0), -- in kg
    height DECIMAL(5,2) CHECK (height > 0), -- in cm
    fitness_goal VARCHAR(50) CHECK (fitness_goal IN ('Reduce Fat', 'Build Muscle', 'Maintain Weight', 'General Fitness')),
    preferred_diet VARCHAR(50) CHECK (preferred_diet IN ('None', 'Vegetarian', 'Vegan', 'Keto', 'Mediterranean', 'Low Carb', 'High Protein')),
    subscription_status VARCHAR(20) DEFAULT 'Basic' CHECK (subscription_status IN ('Basic', 'Premium')),
    payment_method VARCHAR(50) CHECK (payment_method IN ('Apple Pay', 'PayOS', 'Credit Card', 'Bank Transfer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    profile_picture_url VARCHAR(500)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_fitness_goal ON users(fitness_goal);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();