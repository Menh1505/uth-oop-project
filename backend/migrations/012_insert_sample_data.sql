-- Migration: Insert sample data
-- Description: Insert sample data for testing and development

-- Insert sample goals
INSERT INTO goals (goal_type, target_calories, target_protein, target_carbs, target_fat, target_weight, target_duration_weeks, description) VALUES
('Reduce Fat', 1800, 120, 180, 60, 70, 12, 'Weight loss program focusing on fat reduction while maintaining muscle mass'),
('Build Muscle', 2500, 180, 250, 80, 80, 16, 'Muscle building program with high protein intake and strength training'),
('Maintain Weight', 2200, 150, 220, 75, 75, 52, 'Maintenance program for current weight and fitness level'),
('Increase Endurance', 2400, 140, 300, 70, 75, 10, 'Endurance training program for cardiovascular improvement'),
('General Fitness', 2000, 130, 200, 65, 72, 8, 'General fitness and health improvement program');

-- Insert sample food items
INSERT INTO foods (food_name, serving_size, serving_unit, calories, protein, carbs, fat, fiber, food_category, is_vegetarian, is_vegan, is_gluten_free) VALUES
-- Proteins
('Chicken Breast (Grilled)', 100, 'grams', 165, 31, 0, 3.6, 0, 'Meat', false, false, true),
('Salmon (Atlantic, Farmed)', 100, 'grams', 208, 25.4, 0, 12.4, 0, 'Seafood', false, false, true),
('Eggs (Large)', 50, 'grams', 70, 6, 0.6, 4.8, 0, 'Dairy', true, false, true),
('Greek Yogurt (Plain)', 100, 'grams', 59, 10, 3.6, 0.4, 0, 'Dairy', true, false, true),
('Tofu (Firm)', 100, 'grams', 144, 15.8, 4.3, 8.7, 2.3, 'Plant Protein', true, true, true),

-- Carbohydrates
('Brown Rice (Cooked)', 100, 'grams', 112, 2.6, 22.9, 0.9, 1.8, 'Grains', true, true, true),
('Quinoa (Cooked)', 100, 'grams', 120, 4.4, 21.8, 1.9, 2.8, 'Grains', true, true, true),
('Sweet Potato (Baked)', 100, 'grams', 90, 2, 20.7, 0.1, 3.3, 'Vegetables', true, true, true),
('Oats (Dry)', 100, 'grams', 389, 16.9, 66.3, 6.9, 10.6, 'Grains', true, true, false),
('Banana', 100, 'grams', 89, 1.1, 22.8, 0.3, 2.6, 'Fruits', true, true, true),

-- Vegetables
('Broccoli (Raw)', 100, 'grams', 34, 2.8, 6.6, 0.4, 2.6, 'Vegetables', true, true, true),
('Spinach (Raw)', 100, 'grams', 23, 2.9, 3.6, 0.4, 2.2, 'Vegetables', true, true, true),
('Avocado', 100, 'grams', 160, 2, 8.5, 14.7, 6.7, 'Fruits', true, true, true),
('Carrots (Raw)', 100, 'grams', 41, 0.9, 9.6, 0.2, 2.8, 'Vegetables', true, true, true),
('Bell Pepper (Red)', 100, 'grams', 31, 1, 7.3, 0.3, 2.5, 'Vegetables', true, true, true),

-- Nuts and Seeds
('Almonds', 100, 'grams', 579, 21.2, 21.6, 49.9, 12.5, 'Nuts', true, true, true),
('Walnuts', 100, 'grams', 654, 15.2, 13.7, 65.2, 6.7, 'Nuts', true, true, true),
('Chia Seeds', 100, 'grams', 486, 16.5, 42.1, 30.7, 34.4, 'Seeds', true, true, true);

-- Insert sample exercise templates
INSERT INTO exercise_templates (exercise_name, exercise_type, description, muscle_groups, equipment_required, difficulty_level, calories_per_minute) VALUES
('Running', 'Cardio', 'Outdoor or treadmill running', ARRAY['Legs', 'Core'], ARRAY['Running Shoes'], 'Beginner', 10.5),
('Push-ups', 'Strength', 'Classic bodyweight push-ups', ARRAY['Chest', 'Shoulders', 'Triceps'], ARRAY['None'], 'Beginner', 8.0),
('Squats', 'Strength', 'Bodyweight or weighted squats', ARRAY['Legs', 'Glutes'], ARRAY['None'], 'Beginner', 9.0),
('Pull-ups', 'Strength', 'Bodyweight pull-ups', ARRAY['Back', 'Biceps'], ARRAY['Pull-up Bar'], 'Intermediate', 10.0),
('Deadlifts', 'Strength', 'Barbell or dumbbell deadlifts', ARRAY['Back', 'Legs', 'Glutes'], ARRAY['Barbell', 'Weights'], 'Advanced', 12.0),
('Cycling', 'Cardio', 'Stationary or outdoor cycling', ARRAY['Legs'], ARRAY['Bicycle'], 'Beginner', 8.5),
('Yoga', 'Flexibility', 'Various yoga poses and flows', ARRAY['Full Body'], ARRAY['Yoga Mat'], 'Beginner', 3.0),
('Burpees', 'Cardio', 'High-intensity full-body exercise', ARRAY['Full Body'], ARRAY['None'], 'Intermediate', 12.0),
('Plank', 'Strength', 'Core strengthening isometric hold', ARRAY['Core'], ARRAY['None'], 'Beginner', 5.0),
('Jump Rope', 'Cardio', 'Cardiovascular jump rope exercise', ARRAY['Legs', 'Shoulders'], ARRAY['Jump Rope'], 'Beginner', 11.0);

-- Note: Sample users, meals, exercises, etc. would typically be inserted through the application
-- rather than in migrations, but can be added here for development/testing purposes