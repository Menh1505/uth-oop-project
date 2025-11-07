-- Create catalog database migration
CREATE DATABASE catalog_db;

\c catalog_db;

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    image_url VARCHAR(500),
    nutrition_info JSONB,
    allergens TEXT[],
    ingredients TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    restock_date TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id)
);

-- Create indexes for better performance
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_created_at ON products(created_at);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_quantity ON inventory(quantity);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity, low_stock_threshold);

-- Create full-text search index
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO categories (name, description, sort_order) VALUES
('Healthy Meals', 'Nutritious and balanced ready-to-eat meals', 1),
('Protein Foods', 'High-protein options for fitness enthusiasts', 2),
('Vegetables', 'Fresh and organic vegetables', 3),
('Fruits', 'Seasonal fresh fruits', 4),
('Snacks', 'Healthy snacking options', 5),
('Beverages', 'Nutritious drinks and smoothies', 6);

-- Get category IDs for sample products
DO $$
DECLARE
    healthy_meals_id UUID;
    protein_foods_id UUID;
    vegetables_id UUID;
    fruits_id UUID;
    snacks_id UUID;
    beverages_id UUID;
BEGIN
    SELECT id INTO healthy_meals_id FROM categories WHERE name = 'Healthy Meals';
    SELECT id INTO protein_foods_id FROM categories WHERE name = 'Protein Foods';
    SELECT id INTO vegetables_id FROM categories WHERE name = 'Vegetables';
    SELECT id INTO fruits_id FROM categories WHERE name = 'Fruits';
    SELECT id INTO snacks_id FROM categories WHERE name = 'Snacks';
    SELECT id INTO beverages_id FROM categories WHERE name = 'Beverages';

    -- Insert sample products
    INSERT INTO products (name, description, price, category_id, nutrition_info, allergens, ingredients) VALUES
    ('Grilled Chicken Salad', 'Fresh mixed greens with grilled chicken breast', 12.99, healthy_meals_id, 
     '{"calories": 350, "protein": 35, "carbohydrates": 15, "fat": 18}', 
     '{}', '{"mixed greens", "chicken breast", "olive oil", "lemon"}'),
    
    ('Quinoa Power Bowl', 'Quinoa with roasted vegetables and tahini dressing', 11.49, healthy_meals_id,
     '{"calories": 420, "protein": 16, "carbohydrates": 65, "fat": 12}',
     '{"sesame"}', '{"quinoa", "bell peppers", "broccoli", "tahini", "chickpeas"}'),
    
    ('Protein Smoothie', 'Whey protein with banana and almond milk', 8.99, protein_foods_id,
     '{"calories": 280, "protein": 25, "carbohydrates": 30, "fat": 8}',
     '{"milk", "nuts"}', '{"whey protein", "banana", "almond milk", "peanut butter"}'),
    
    ('Greek Yogurt Parfait', 'Greek yogurt with berries and granola', 7.49, protein_foods_id,
     '{"calories": 320, "protein": 20, "carbohydrates": 35, "fat": 12}',
     '{"milk", "gluten", "nuts"}', '{"greek yogurt", "mixed berries", "granola", "honey"}'),
    
    ('Organic Spinach', 'Fresh organic baby spinach leaves', 3.99, vegetables_id,
     '{"calories": 23, "protein": 3, "carbohydrates": 4, "fat": 0}',
     '{}', '{"organic spinach"}'),
    
    ('Seasonal Fruit Mix', 'Mixed seasonal fruits', 6.99, fruits_id,
     '{"calories": 160, "protein": 2, "carbohydrates": 40, "fat": 1}',
     '{}', '{"apples", "bananas", "oranges", "grapes"}'),
    
    ('Trail Mix', 'Nuts, seeds, and dried fruits mix', 5.99, snacks_id,
     '{"calories": 180, "protein": 6, "carbohydrates": 16, "fat": 12}',
     '{"nuts"}', '{"almonds", "walnuts", "pumpkin seeds", "dried cranberries"}'),
    
    ('Green Smoothie', 'Spinach, apple, and ginger smoothie', 6.49, beverages_id,
     '{"calories": 120, "protein": 3, "carbohydrates": 28, "fat": 1}',
     '{}', '{"spinach", "apple", "ginger", "lemon", "water"}');
END $$;

-- Create inventory records for all products
INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT id, 50, 0, 10 FROM products;

COMMIT;