#!/bin/bash
set -e

# Create separate databases for each microservice
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE DATABASE fitfood_auth_db;
  CREATE DATABASE fitfood_user_db; 
  CREATE DATABASE fitfood_meal_db;
  CREATE DATABASE fitfood_exercise_db;
  CREATE DATABASE fitfood_goal_db;
  CREATE DATABASE fitfood_recommendation_db;
  CREATE DATABASE fitfood_payment_db;
EOSQL

echo "✓ All databases created"

# Initialize Auth Service Database
echo "Initializing Auth Service database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_auth_db" <<EOF
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main users table (matching code expectation)
CREATE TABLE IF NOT EXISTS users_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for refresh tokens
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_auth(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent VARCHAR(255),
    ip INET,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social login identities
CREATE TABLE IF NOT EXISTS identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_auth(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_uid VARCHAR(255) NOT NULL,
    meta JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_uid)
);

-- Token blacklist for logout
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users_auth(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles system
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_auth(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    tenant_id UUID,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id, tenant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_email ON users_auth(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_username ON users_auth(username);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_identities_user_id ON identities(user_id);
CREATE INDEX IF NOT EXISTS idx_identities_provider ON identities(provider, provider_uid);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('user', 'Regular user'),
('admin', 'Administrator'),
('premium', 'Premium user')
ON CONFLICT (name) DO NOTHING;
EOF

# Initialize User Service Database
echo "Initializing User Service database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_user_db" <<EOF
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    profile_picture_url TEXT,
    age INTEGER,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    height DECIMAL(5,2), -- in cm
    weight DECIMAL(5,2), -- in kg
    activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
    dietary_restrictions TEXT[],
    allergies TEXT[],
    health_conditions TEXT[],
    fitness_goals TEXT[],
    is_premium BOOLEAN DEFAULT false,
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
EOF

# Initialize Meal Service Database
echo "Initializing Meal Service database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_meal_db" <<EOF
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Foods catalog
CREATE TABLE IF NOT EXISTS foods (
    food_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    serving_size DECIMAL(8,2),
    serving_unit VARCHAR(50),
    calories DECIMAL(8,2),
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fat DECIMAL(6,2),
    fiber DECIMAL(6,2),
    sugar DECIMAL(6,2),
    sodium DECIMAL(8,2),
    cholesterol DECIMAL(8,2),
    vitamin_a DECIMAL(8,2),
    vitamin_c DECIMAL(8,2),
    calcium DECIMAL(8,2),
    iron DECIMAL(8,2),
    barcode VARCHAR(50),
    brand VARCHAR(255),
    allergens TEXT,
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_gluten_free BOOLEAN DEFAULT false,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User meals
CREATE TABLE IF NOT EXISTS meals (
    meal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    meal_name VARCHAR(255),
    meal_type VARCHAR(20) NOT NULL,
    meal_date DATE NOT NULL,
    meal_time TIME,
    total_calories DECIMAL(8,2) DEFAULT 0,
    total_protein DECIMAL(6,2) DEFAULT 0,
    total_carbs DECIMAL(6,2) DEFAULT 0,
    total_fat DECIMAL(6,2) DEFAULT 0,
    total_fiber DECIMAL(6,2) DEFAULT 0,
    total_sugar DECIMAL(6,2) DEFAULT 0,
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meal-Food relationships
CREATE TABLE IF NOT EXISTS meal_foods (
    meal_food_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID NOT NULL REFERENCES meals(meal_id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(food_id) ON DELETE CASCADE,
    quantity DECIMAL(8,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    calories_consumed DECIMAL(8,2),
    protein_consumed DECIMAL(6,2),
    carbs_consumed DECIMAL(6,2),
    fat_consumed DECIMAL(6,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode);
CREATE INDEX IF NOT EXISTS idx_foods_active ON foods(is_active);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(meal_date);
CREATE INDEX IF NOT EXISTS idx_meal_foods_meal_id ON meal_foods(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_foods_food_id ON meal_foods(food_id);

-- Sample foods
INSERT INTO foods (food_name, category, serving_size, serving_unit, calories, protein, carbs, fat, fiber, sugar) VALUES
('White Rice', 'Grains', 100, 'g', 130, 2.7, 28.0, 0.3, 0.4, 0.1),
('Chicken Breast', 'Protein', 100, 'g', 165, 31.0, 0.0, 3.6, 0.0, 0.0),
('Broccoli', 'Vegetables', 100, 'g', 34, 2.8, 7.0, 0.4, 2.6, 1.5),
('Banana', 'Fruits', 100, 'g', 89, 1.1, 23.0, 0.3, 2.6, 12.0),
('Salmon', 'Protein', 100, 'g', 208, 20.0, 0.0, 13.0, 0.0, 0.0)
ON CONFLICT DO NOTHING;
EOF

# Initialize Exercise Service Database
echo "Initializing Exercise Service database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_exercise_db" <<EOF
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User exercises
CREATE TABLE IF NOT EXISTS exercises (
    exercise_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    exercise_name VARCHAR(255) NOT NULL,
    exercise_date DATE NOT NULL,
    exercise_time TIME,
    duration_minutes INTEGER,
    calories_burned DECIMAL(8,2),
    intensity VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_date ON exercises(exercise_date);
EOF

# Initialize Goal Service Database  
echo "Initializing Goal Service database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_goal_db" <<EOF
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User goals
CREATE TABLE IF NOT EXISTS goals (
    goal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    goal_type VARCHAR(50) NOT NULL,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20),
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-Goal relationships
CREATE TABLE IF NOT EXISTS user_goals (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    goal_id UUID NOT NULL REFERENCES goals(goal_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, goal_id)
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
EOF

# Initialize Recommendation Service Database
echo "Initializing Recommendation Service database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_recommendation_db" <<EOF
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    recommendation_type VARCHAR(20) NOT NULL CHECK (recommendation_type IN ('meal', 'exercise', 'goal', 'nutrition', 'recipe')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    priority INTEGER DEFAULT 1,
    is_read BOOLEAN DEFAULT false,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_unread ON recommendations(user_id, is_read);
EOF

# Initialize Payment Service Database
echo "Initializing Payment Service database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_payment_db" <<EOF
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('basic', 'premium')),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
    payment_id INTEGER REFERENCES payments(id),
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON user_subscriptions(user_id, is_active, end_date);

-- Default subscription plans
INSERT INTO subscriptions (type, price, duration_days, features) VALUES 
('basic', 0, 30, '{"Basic meal tracking", "Exercise logging", "Goal setting"}'),
('premium', 199000, 30, '{"All basic features", "AI recommendations", "Advanced analytics", "Premium support", "Unlimited meal tracking"}')
ON CONFLICT DO NOTHING;
EOF

echo "✓ All service databases initialized successfully"
echo "✓ Database migration completed"
