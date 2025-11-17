-- Partner Service Database Schema
-- This file creates the partner_db database and its tables

-- Create database (if not exists)
-- CREATE DATABASE partner_db;

-- Connect to partner_db
\c partner_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= PARTNERS TABLE =============
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    tax_id VARCHAR(100) NOT NULL UNIQUE,
    contact_person VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'INACTIVE'
    )),
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.15 CHECK (commission_rate >= 0 AND commission_rate <= 1),
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_restaurants INTEGER DEFAULT 0 CHECK (total_restaurants >= 0),
    total_revenue DECIMAL(15,2) DEFAULT 0 CHECK (total_revenue >= 0),
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============= RESTAURANTS TABLE =============
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'FAST_FOOD', 'CASUAL_DINING', 'FINE_DINING', 'CAFE', 'BAKERY', 
        'STREET_FOOD', 'VEGETARIAN', 'SEAFOOD', 'BBQ', 'ASIAN', 'WESTERN', 'VIETNAMESE'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'CLOSED' CHECK (status IN (
        'OPEN', 'CLOSED', 'BUSY', 'TEMPORARILY_CLOSED', 'PERMANENTLY_CLOSED'
    )),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    
    -- Address information
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    ward VARCHAR(100),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    
    -- Business hours (JSON format: {"monday": {"open": "08:00", "close": "22:00", "is_closed": false}})
    opening_hours JSONB NOT NULL DEFAULT '{}',
    
    -- Financial information
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    minimum_order DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (minimum_order >= 0),
    delivery_radius DECIMAL(5,2) NOT NULL DEFAULT 5 CHECK (delivery_radius > 0), -- in kilometers
    
    -- Ratings and reviews
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    total_orders INTEGER DEFAULT 0 CHECK (total_orders >= 0),
    average_order_value DECIMAL(10,2) DEFAULT 0 CHECK (average_order_value >= 0),
    
    -- Images
    logo_url TEXT,
    cover_image_url TEXT,
    gallery_images JSONB DEFAULT '[]',
    
    -- Features (JSON array: ["delivery", "pickup", "dine_in", "wifi", "parking"])
    features JSONB DEFAULT '[]',
    
    -- Menu stats
    total_menu_items INTEGER DEFAULT 0 CHECK (total_menu_items >= 0),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============= MENU_ITEMS TABLE =============
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    catalog_item_id VARCHAR(255), -- Link to catalog service
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'APPETIZER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE', 'SIDE_DISH', 
        'SOUP', 'SALAD', 'PIZZA', 'BURGER', 'NOODLES', 'RICE', 'VEGETARIAN', 'VEGAN'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN (
        'AVAILABLE', 'UNAVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED'
    )),
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price > 0),
    sale_price DECIMAL(10,2) CHECK (sale_price IS NULL OR sale_price > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    
    -- Nutrition and dietary
    calories INTEGER CHECK (calories IS NULL OR calories > 0),
    ingredients JSONB DEFAULT '[]',
    allergens JSONB DEFAULT '[]',
    dietary_info JSONB DEFAULT '[]', -- ["vegetarian", "vegan", "gluten_free", "halal"]
    
    -- Images and media
    image_url TEXT,
    gallery_images JSONB DEFAULT '[]',
    
    -- Availability
    available_days JSONB DEFAULT '[]', -- ["monday", "tuesday", ...]
    available_times JSONB DEFAULT '[]', -- [{"start": "08:00", "end": "22:00"}]
    
    -- Inventory link
    inventory_tracked BOOLEAN DEFAULT FALSE,
    
    -- Popularity
    order_count INTEGER DEFAULT 0 CHECK (order_count >= 0),
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    
    -- Customization options (JSON format with options and prices)
    customization_options JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============= PROMOTIONS TABLE =============
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'PERCENTAGE', 'FIXED_AMOUNT', 'BUY_ONE_GET_ONE', 'FREE_DELIVERY', 'BUNDLE'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED'
    )),
    
    -- Discount details
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    max_discount_amount DECIMAL(10,2) CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
    min_order_amount DECIMAL(10,2) CHECK (min_order_amount IS NULL OR min_order_amount > 0),
    
    -- Validity
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL CHECK (end_date > start_date),
    usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
    usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
    usage_per_customer INTEGER CHECK (usage_per_customer IS NULL OR usage_per_customer > 0),
    
    -- Applicable items (JSON arrays with IDs)
    applicable_items JSONB DEFAULT '[]', -- menu item IDs
    applicable_categories JSONB DEFAULT '[]', -- menu item categories
    
    -- Conditions
    applicable_days JSONB DEFAULT '[]', -- ["monday", "tuesday", ...]
    applicable_times JSONB DEFAULT '[]', -- [{"start": "18:00", "end": "21:00"}]
    
    -- Promo code
    promo_code VARCHAR(50) UNIQUE,
    auto_apply BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============= INVENTORY TABLE =============
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    ingredient_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_STOCK' CHECK (status IN (
        'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED'
    )),
    
    -- Stock levels
    current_stock DECIMAL(10,2) NOT NULL CHECK (current_stock >= 0),
    minimum_stock DECIMAL(10,2) NOT NULL CHECK (minimum_stock >= 0),
    maximum_stock DECIMAL(10,2) NOT NULL CHECK (maximum_stock >= minimum_stock),
    unit VARCHAR(20) NOT NULL, -- 'kg', 'pieces', 'liters', etc.
    
    -- Cost information
    cost_per_unit DECIMAL(10,2) NOT NULL CHECK (cost_per_unit >= 0),
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(255),
    
    -- Tracking
    last_restocked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    
    -- Alerts
    low_stock_alert BOOLEAN DEFAULT TRUE,
    expiry_alert BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============= INDEXES =============

-- Partners indexes
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_business_type ON partners(business_type);
CREATE INDEX IF NOT EXISTS idx_partners_tax_id ON partners(tax_id);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON partners(created_at);

-- Restaurants indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_partner_id ON restaurants(partner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_type ON restaurants(type);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_district ON restaurants(district);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON restaurants(rating);
CREATE INDEX IF NOT EXISTS idx_restaurants_created_at ON restaurants(created_at);

-- Menu items indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_catalog_item_id ON menu_items(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_status ON menu_items(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_price ON menu_items(base_price);
CREATE INDEX IF NOT EXISTS idx_menu_items_order_count ON menu_items(order_count);
CREATE INDEX IF NOT EXISTS idx_menu_items_rating ON menu_items(rating);
CREATE INDEX IF NOT EXISTS idx_menu_items_created_at ON menu_items(created_at);

-- Promotions indexes
CREATE INDEX IF NOT EXISTS idx_promotions_restaurant_id ON promotions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_partner_id ON promotions(partner_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_promo_code ON promotions(promo_code);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_created_at ON promotions(created_at);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant_id ON inventory(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_menu_item_id ON inventory(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_ingredient_name ON inventory(ingredient_name);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_levels ON inventory(current_stock, minimum_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON inventory(created_at);

-- ============= TRIGGERS =============

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_partners_updated_at 
    BEFORE UPDATE ON partners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at 
    BEFORE UPDATE ON restaurants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON menu_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at 
    BEFORE UPDATE ON promotions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at 
    BEFORE UPDATE ON inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inventory status update trigger
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on stock levels
    IF NEW.current_stock <= 0 THEN
        NEW.status = 'OUT_OF_STOCK';
    ELSIF NEW.current_stock <= NEW.minimum_stock THEN
        NEW.status = 'LOW_STOCK';
    ELSE
        NEW.status = 'IN_STOCK';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_status_trigger
    BEFORE INSERT OR UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_inventory_status();

-- Update restaurant menu item count trigger
CREATE OR REPLACE FUNCTION update_restaurant_menu_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE restaurants SET total_menu_items = total_menu_items + 1 WHERE id = NEW.restaurant_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE restaurants SET total_menu_items = total_menu_items - 1 WHERE id = OLD.restaurant_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_restaurant_menu_count_trigger
    AFTER INSERT OR DELETE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_restaurant_menu_count();

-- Update partner restaurant count trigger
CREATE OR REPLACE FUNCTION update_partner_restaurant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE partners SET total_restaurants = total_restaurants + 1 WHERE id = NEW.partner_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE partners SET total_restaurants = total_restaurants - 1 WHERE id = OLD.partner_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partner_restaurant_count_trigger
    AFTER INSERT OR DELETE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_partner_restaurant_count();

-- ============= SAMPLE DATA FOR TESTING =============

-- Insert sample partners
INSERT INTO partners (
    user_id, business_name, business_type, tax_id, contact_person, 
    contact_email, contact_phone, status, commission_rate
) VALUES 
(
    'user123', 'Nhà Hàng Phố Cổ', 'Restaurant Chain', '0123456789-001', 
    'Nguyễn Văn A', 'contact@phocorestaurant.com', '+84901234567', 'ACTIVE', 0.12
),
(
    'user124', 'Quán Cà Phê Sài Gòn', 'Coffee Shop', '0123456789-002', 
    'Trần Thị B', 'info@saigoncafe.com', '+84902345678', 'ACTIVE', 0.15
),
(
    'user125', 'Bánh Mì Huỳnh Hoa', 'Fast Food', '0123456789-003', 
    'Lê Văn C', 'order@banhmihuynhhoa.com', '+84903456789', 'PENDING', 0.18
)
ON CONFLICT DO NOTHING;

-- Insert sample restaurants
INSERT INTO restaurants (
    partner_id, name, description, type, phone, email, address, city, district, ward,
    latitude, longitude, delivery_fee, minimum_order, delivery_radius, status,
    opening_hours, features
) SELECT 
    p.id, 'Phở Cổ Truyền', 'Phở bò truyền thống Hà Nội với công thức gia truyền', 
    'VIETNAMESE', '+84901234567', 'pho@phocorestaurant.com', 
    '123 Phố Cổ, Hoàn Kiếm, Hà Nội', 'Hà Nội', 'Hoàn Kiếm', 'Phố Cổ',
    21.0285, 105.8542, 15000.00, 50000.00, 5.0, 'OPEN',
    '{"monday": {"open": "06:00", "close": "22:00", "is_closed": false}, "tuesday": {"open": "06:00", "close": "22:00", "is_closed": false}}',
    '["delivery", "pickup", "dine_in"]'
FROM partners p WHERE p.business_name = 'Nhà Hàng Phố Cổ'
ON CONFLICT DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (
    restaurant_id, name, description, category, base_price, currency,
    ingredients, dietary_info, available_days, inventory_tracked
) SELECT 
    r.id, 'Phở Bò Tái', 'Phở bò với thịt tái thơm ngon, nước dùng đậm đà', 
    'MAIN_COURSE', 65000.00, 'VND',
    '["Bánh phở", "Thịt bò", "Hành lá", "Ngò rí", "Nước dùng"]',
    '["gluten_free"]',
    '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]',
    true
FROM restaurants r WHERE r.name = 'Phở Cổ Truyền'
ON CONFLICT DO NOTHING;

-- Insert sample promotions
INSERT INTO promotions (
    restaurant_id, partner_id, name, description, type, discount_value,
    start_date, end_date, status, auto_apply
) SELECT 
    r.id, r.partner_id, 'Giảm giá 20% cho đơn đầu tiên', 
    'Chào mừng khách hàng mới với ưu đãi đặc biệt', 'PERCENTAGE', 20.00,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', true
FROM restaurants r WHERE r.name = 'Phở Cổ Truyền'
ON CONFLICT DO NOTHING;

-- Insert sample inventory
INSERT INTO inventory (
    restaurant_id, menu_item_id, ingredient_name, current_stock, 
    minimum_stock, maximum_stock, unit, cost_per_unit, supplier_name
) SELECT 
    r.id, m.id, 'Bánh phở khô', 50.00, 10.00, 100.00, 'kg', 25000.00, 'Công ty TNHH Bánh phở Hà Nội'
FROM restaurants r
JOIN menu_items m ON r.id = m.restaurant_id
WHERE r.name = 'Phở Cổ Truyền' AND m.name = 'Phở Bò Tái'
ON CONFLICT DO NOTHING;

-- Display table information
SELECT 'Database schema created successfully!' as status;
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('partners', 'restaurants', 'menu_items', 'promotions', 'inventory')
ORDER BY table_name, ordinal_position;