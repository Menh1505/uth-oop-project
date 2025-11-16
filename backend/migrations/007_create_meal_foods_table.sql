-- Migration: Create Meal Foods junction table
-- Description: Many-to-many relationship between meals and foods

CREATE TABLE IF NOT EXISTS meal_foods (
    meal_food_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(meal_id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(food_id) ON DELETE RESTRICT,
    quantity DECIMAL(8,2) NOT NULL CHECK (quantity > 0), -- Amount consumed
    unit VARCHAR(20) DEFAULT 'grams', -- Unit of measurement
    calories_consumed DECIMAL(8,2) NOT NULL CHECK (calories_consumed >= 0),
    protein_consumed DECIMAL(6,2) DEFAULT 0 CHECK (protein_consumed >= 0),
    carbs_consumed DECIMAL(6,2) DEFAULT 0 CHECK (carbs_consumed >= 0),
    fat_consumed DECIMAL(6,2) DEFAULT 0 CHECK (fat_consumed >= 0),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_meal_foods_meal_id ON meal_foods(meal_id);
CREATE INDEX idx_meal_foods_food_id ON meal_foods(food_id);

-- Create unique constraint to prevent duplicate foods in same meal
CREATE UNIQUE INDEX idx_meal_foods_unique ON meal_foods(meal_id, food_id);

-- Create function to update meal totals when meal_foods change
CREATE OR REPLACE FUNCTION update_meal_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE meals SET 
        total_calories = (
            SELECT COALESCE(SUM(calories_consumed), 0) 
            FROM meal_foods 
            WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id)
        ),
        total_protein = (
            SELECT COALESCE(SUM(protein_consumed), 0) 
            FROM meal_foods 
            WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id)
        ),
        total_carbs = (
            SELECT COALESCE(SUM(carbs_consumed), 0) 
            FROM meal_foods 
            WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id)
        ),
        total_fat = (
            SELECT COALESCE(SUM(fat_consumed), 0) 
            FROM meal_foods 
            WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers to update meal totals
CREATE TRIGGER update_meal_totals_on_insert 
    AFTER INSERT ON meal_foods 
    FOR EACH ROW 
    EXECUTE FUNCTION update_meal_totals();

CREATE TRIGGER update_meal_totals_on_update 
    AFTER UPDATE ON meal_foods 
    FOR EACH ROW 
    EXECUTE FUNCTION update_meal_totals();

CREATE TRIGGER update_meal_totals_on_delete 
    AFTER DELETE ON meal_foods 
    FOR EACH ROW 
    EXECUTE FUNCTION update_meal_totals();