-- Nutrition Service Database Schema
-- Drop existing tables if they exist (for development only)
DROP TABLE IF EXISTS nutrition_analyses CASCADE;
DROP TABLE IF EXISTS nutrition_goals CASCADE;
DROP TABLE IF EXISTS meal_logs CASCADE;
DROP TABLE IF EXISTS foods CASCADE;

-- Create ENUM types
CREATE TYPE food_category AS ENUM (
  'FRUITS',
  'VEGETABLES',
  'GRAINS',
  'PROTEIN',
  'DAIRY',
  'FATS',
  'SWEETS',
  'BEVERAGES',
  'SNACKS',
  'PREPARED_MEALS',
  'SUPPLEMENTS',
  'OTHER'
);

CREATE TYPE meal_type AS ENUM (
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACK'
);

CREATE TYPE analysis_type AS ENUM (
  'DAILY',
  'WEEKLY',
  'MONTHLY'
);

-- Foods table - stores nutrition information for foods
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  category food_category NOT NULL DEFAULT 'OTHER',
  serving_size DECIMAL(8,2) NOT NULL DEFAULT 100, -- grams
  serving_unit VARCHAR(50) DEFAULT 'g',
  barcode VARCHAR(50),
  is_public BOOLEAN DEFAULT false,
  
  -- Nutritional values per serving
  calories DECIMAL(8,2) NOT NULL DEFAULT 0,
  protein DECIMAL(8,2) DEFAULT 0, -- grams
  carbs DECIMAL(8,2) DEFAULT 0, -- grams
  fat DECIMAL(8,2) DEFAULT 0, -- grams
  fiber DECIMAL(8,2) DEFAULT 0, -- grams
  sugar DECIMAL(8,2) DEFAULT 0, -- grams
  sodium DECIMAL(8,2) DEFAULT 0, -- mg
  
  -- Vitamins (mg)
  vitamin_a DECIMAL(8,2) DEFAULT 0,
  vitamin_c DECIMAL(8,2) DEFAULT 0,
  vitamin_d DECIMAL(8,2) DEFAULT 0,
  vitamin_e DECIMAL(8,2) DEFAULT 0,
  vitamin_k DECIMAL(8,2) DEFAULT 0,
  
  -- B Vitamins (mg)
  vitamin_b1 DECIMAL(8,2) DEFAULT 0,
  vitamin_b2 DECIMAL(8,2) DEFAULT 0,
  vitamin_b3 DECIMAL(8,2) DEFAULT 0,
  vitamin_b6 DECIMAL(8,2) DEFAULT 0,
  vitamin_b12 DECIMAL(8,2) DEFAULT 0,
  folate DECIMAL(8,2) DEFAULT 0,
  
  -- Minerals (mg)
  calcium DECIMAL(8,2) DEFAULT 0,
  iron DECIMAL(8,2) DEFAULT 0,
  magnesium DECIMAL(8,2) DEFAULT 0,
  phosphorus DECIMAL(8,2) DEFAULT 0,
  potassium DECIMAL(8,2) DEFAULT 0,
  zinc DECIMAL(8,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meal logs table - records of what users eat
CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  meal_type meal_type NOT NULL,
  quantity DECIMAL(8,2) NOT NULL DEFAULT 1, -- servings
  consumed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Nutrition goals table - user's daily nutrition targets
CREATE TABLE nutrition_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  calories DECIMAL(8,2) NOT NULL DEFAULT 2000,
  protein DECIMAL(8,2) DEFAULT 150, -- grams
  carbs DECIMAL(8,2) DEFAULT 250, -- grams
  fat DECIMAL(8,2) DEFAULT 65, -- grams
  fiber DECIMAL(8,2) DEFAULT 25, -- grams
  sugar DECIMAL(8,2) DEFAULT 50, -- grams
  sodium DECIMAL(8,2) DEFAULT 2300, -- mg
  
  -- Activity level and goals
  activity_level VARCHAR(20) DEFAULT 'MODERATE', -- SEDENTARY, LIGHT, MODERATE, ACTIVE, VERY_ACTIVE
  goal VARCHAR(20) DEFAULT 'MAINTAIN', -- LOSE, MAINTAIN, GAIN
  target_weight DECIMAL(5,2), -- kg
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Nutrition analyses table - calculated nutrition summaries
CREATE TABLE nutrition_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  analysis_type analysis_type NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Calculated totals
  total_calories DECIMAL(10,2) DEFAULT 0,
  total_protein DECIMAL(10,2) DEFAULT 0,
  total_carbs DECIMAL(10,2) DEFAULT 0,
  total_fat DECIMAL(10,2) DEFAULT 0,
  total_fiber DECIMAL(10,2) DEFAULT 0,
  total_sugar DECIMAL(10,2) DEFAULT 0,
  total_sodium DECIMAL(10,2) DEFAULT 0,
  
  -- Goal comparison
  calorie_goal DECIMAL(8,2),
  protein_goal DECIMAL(8,2),
  carbs_goal DECIMAL(8,2),
  fat_goal DECIMAL(8,2),
  
  -- Achievement percentages
  calorie_achievement DECIMAL(5,2) DEFAULT 0, -- percentage
  protein_achievement DECIMAL(5,2) DEFAULT 0,
  carbs_achievement DECIMAL(5,2) DEFAULT 0,
  fat_achievement DECIMAL(5,2) DEFAULT 0,
  
  meal_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance

-- Foods indexes
CREATE INDEX idx_foods_user_id ON foods(user_id);
CREATE INDEX idx_foods_category ON foods(category);
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_foods_barcode ON foods(barcode);
CREATE INDEX idx_foods_is_public ON foods(is_public);
CREATE INDEX idx_foods_created_at ON foods(created_at);

-- Meal logs indexes
CREATE INDEX idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX idx_meal_logs_food_id ON meal_logs(food_id);
CREATE INDEX idx_meal_logs_meal_type ON meal_logs(meal_type);
CREATE INDEX idx_meal_logs_consumed_at ON meal_logs(consumed_at);
CREATE INDEX idx_meal_logs_user_consumed ON meal_logs(user_id, consumed_at);

-- Nutrition goals indexes
CREATE INDEX idx_nutrition_goals_user_id ON nutrition_goals(user_id);

-- Nutrition analyses indexes
CREATE INDEX idx_nutrition_analyses_user_id ON nutrition_analyses(user_id);
CREATE INDEX idx_nutrition_analyses_type ON nutrition_analyses(analysis_type);
CREATE INDEX idx_nutrition_analyses_period ON nutrition_analyses(period_start, period_end);
CREATE INDEX idx_nutrition_analyses_user_period ON nutrition_analyses(user_id, period_start, period_end);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON foods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_logs_updated_at BEFORE UPDATE ON meal_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_goals_updated_at BEFORE UPDATE ON nutrition_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_analyses_updated_at BEFORE UPDATE ON nutrition_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Sample public foods
INSERT INTO foods (user_id, name, brand, category, serving_size, serving_unit, calories, protein, carbs, fat, fiber, sugar, sodium, is_public) VALUES
-- Fruits
('00000000-0000-0000-0000-000000000000', 'Apple', NULL, 'FRUITS', 100, 'g', 52, 0.3, 14, 0.2, 2.4, 10, 1, true),
('00000000-0000-0000-0000-000000000000', 'Banana', NULL, 'FRUITS', 100, 'g', 89, 1.1, 23, 0.3, 2.6, 12, 1, true),
('00000000-0000-0000-0000-000000000000', 'Orange', NULL, 'FRUITS', 100, 'g', 47, 0.9, 12, 0.1, 2.4, 9, 0, true),

-- Vegetables
('00000000-0000-0000-0000-000000000000', 'Broccoli', NULL, 'VEGETABLES', 100, 'g', 34, 2.8, 7, 0.4, 2.6, 1.5, 33, true),
('00000000-0000-0000-0000-000000000000', 'Carrot', NULL, 'VEGETABLES', 100, 'g', 41, 0.9, 10, 0.2, 2.8, 4.7, 69, true),
('00000000-0000-0000-0000-000000000000', 'Spinach', NULL, 'VEGETABLES', 100, 'g', 23, 2.9, 3.6, 0.4, 2.2, 0.4, 79, true),

-- Proteins
('00000000-0000-0000-0000-000000000000', 'Chicken Breast', NULL, 'PROTEIN', 100, 'g', 165, 31, 0, 3.6, 0, 0, 74, true),
('00000000-0000-0000-0000-000000000000', 'Salmon', NULL, 'PROTEIN', 100, 'g', 208, 25, 0, 12, 0, 0, 59, true),
('00000000-0000-0000-0000-000000000000', 'Eggs', NULL, 'PROTEIN', 100, 'g', 155, 13, 1.1, 11, 0, 1.1, 124, true),

-- Grains
('00000000-0000-0000-0000-000000000000', 'Brown Rice', NULL, 'GRAINS', 100, 'g', 111, 2.6, 23, 0.9, 1.8, 0.4, 5, true),
('00000000-0000-0000-0000-000000000000', 'Oats', NULL, 'GRAINS', 100, 'g', 389, 16.9, 66, 6.9, 10.6, 0.99, 2, true),
('00000000-0000-0000-0000-000000000000', 'Quinoa', NULL, 'GRAINS', 100, 'g', 120, 4.4, 22, 1.9, 2.8, 0.9, 7, true),

-- Dairy
('00000000-0000-0000-0000-000000000000', 'Greek Yogurt', NULL, 'DAIRY', 100, 'g', 59, 10, 3.6, 0.4, 0, 3.2, 36, true),
('00000000-0000-0000-0000-000000000000', 'Milk', NULL, 'DAIRY', 100, 'ml', 42, 3.4, 5, 1, 0, 5, 44, true),
('00000000-0000-0000-0000-000000000000', 'Cheddar Cheese', NULL, 'DAIRY', 100, 'g', 403, 25, 1.3, 33, 0, 0.5, 621, true);

-- Sample nutrition goals for a test user
INSERT INTO nutrition_goals (user_id, calories, protein, carbs, fat, fiber, sugar, sodium, activity_level, goal) VALUES
('11111111-1111-1111-1111-111111111111', 2000, 150, 250, 65, 25, 50, 2300, 'MODERATE', 'MAINTAIN');

-- Sample meal logs for testing
INSERT INTO meal_logs (user_id, food_id, meal_type, quantity, consumed_at, notes) VALUES
('11111111-1111-1111-1111-111111111111', 
 (SELECT id FROM foods WHERE name = 'Oats' LIMIT 1), 
 'BREAKFAST', 0.5, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'With milk'),
('11111111-1111-1111-1111-111111111111', 
 (SELECT id FROM foods WHERE name = 'Banana' LIMIT 1), 
 'BREAKFAST', 1, CURRENT_TIMESTAMP - INTERVAL '2 hours', NULL),
('11111111-1111-1111-1111-111111111111', 
 (SELECT id FROM foods WHERE name = 'Chicken Breast' LIMIT 1), 
 'LUNCH', 1.5, CURRENT_TIMESTAMP - INTERVAL '4 hours', 'Grilled'),
('11111111-1111-1111-1111-111111111111', 
 (SELECT id FROM foods WHERE name = 'Brown Rice' LIMIT 1), 
 'LUNCH', 1, CURRENT_TIMESTAMP - INTERVAL '4 hours', NULL);

COMMIT;