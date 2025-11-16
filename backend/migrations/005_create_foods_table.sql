-- Migration: Create Food table
-- Description: Food items with nutritional information

CREATE TABLE IF NOT EXISTS foods (
    food_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    serving_size DECIMAL(8,2) NOT NULL CHECK (serving_size > 0), -- in grams
    serving_unit VARCHAR(20) DEFAULT 'grams',
    calories DECIMAL(8,2) NOT NULL CHECK (calories >= 0), -- per serving
    protein DECIMAL(6,2) DEFAULT 0 CHECK (protein >= 0), -- in grams
    carbs DECIMAL(6,2) DEFAULT 0 CHECK (carbs >= 0), -- in grams
    fat DECIMAL(6,2) DEFAULT 0 CHECK (fat >= 0), -- in grams
    fiber DECIMAL(6,2) DEFAULT 0 CHECK (fiber >= 0), -- in grams
    sugar DECIMAL(6,2) DEFAULT 0 CHECK (sugar >= 0), -- in grams
    sodium DECIMAL(8,2) DEFAULT 0 CHECK (sodium >= 0), -- in mg
    cholesterol DECIMAL(6,2) DEFAULT 0 CHECK (cholesterol >= 0), -- in mg
    vitamin_a DECIMAL(8,2) DEFAULT 0 CHECK (vitamin_a >= 0), -- in IU
    vitamin_c DECIMAL(6,2) DEFAULT 0 CHECK (vitamin_c >= 0), -- in mg
    calcium DECIMAL(6,2) DEFAULT 0 CHECK (calcium >= 0), -- in mg
    iron DECIMAL(6,2) DEFAULT 0 CHECK (iron >= 0), -- in mg
    food_category VARCHAR(50), -- e.g., Fruits, Vegetables, Meat, Dairy
    allergens TEXT[], -- Array of allergens
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_gluten_free BOOLEAN DEFAULT false,
    barcode VARCHAR(50),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_foods_food_name ON foods(food_name);
CREATE INDEX idx_foods_food_category ON foods(food_category);
CREATE INDEX idx_foods_is_vegetarian ON foods(is_vegetarian);
CREATE INDEX idx_foods_is_vegan ON foods(is_vegan);
CREATE INDEX idx_foods_is_gluten_free ON foods(is_gluten_free);
CREATE INDEX idx_foods_calories ON foods(calories);
CREATE INDEX idx_foods_barcode ON foods(barcode);

-- Create full-text search index
CREATE INDEX idx_foods_search ON foods USING gin(to_tsvector('english', food_name || ' ' || COALESCE(brand, '')));

-- Create trigger for updated_at
CREATE TRIGGER update_foods_updated_at 
    BEFORE UPDATE ON foods 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();