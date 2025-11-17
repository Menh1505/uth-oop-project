-- Order Service Database Schema
-- Created for food ordering system with order lifecycle management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= ORDERS TABLE =============
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  restaurant_id VARCHAR(255),
  
  -- Order Identification
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  delivery_type VARCHAR(50) NOT NULL DEFAULT 'DELIVERY',
  priority VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
  
  -- Financial Information
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  
  -- Customer Information
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Delivery Information
  delivery_address TEXT,
  delivery_notes TEXT,
  delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  
  -- Order Details
  estimated_prep_time INTEGER, -- in minutes
  special_instructions TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  CONSTRAINT valid_delivery_type CHECK (delivery_type IN ('DELIVERY', 'PICKUP', 'DINE_IN')),
  CONSTRAINT valid_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  CONSTRAINT positive_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND delivery_fee >= 0 AND discount_amount >= 0 AND total_amount >= 0)
);

-- ============= ORDER ITEMS TABLE =============
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Information
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  category VARCHAR(100),
  
  -- Pricing
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Customization
  customizations JSONB DEFAULT '[]'::jsonb,
  special_requests TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT positive_pricing CHECK (unit_price >= 0 AND quantity > 0 AND total_price >= 0)
);

-- ============= ORDER STATUS HISTORY TABLE =============
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Status Change Information
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(255) NOT NULL,
  reason TEXT,
  notes TEXT,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_previous_status CHECK (previous_status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED')),
  CONSTRAINT valid_new_status CHECK (new_status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'))
);

-- ============= INDEXES FOR PERFORMANCE =============

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON orders(delivery_type);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_time ON orders(delivery_time);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_category ON order_items(category);

-- Order status history indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_new_status ON order_status_history(new_status);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at);

-- ============= TRIGGERS FOR AUTO-UPDATE =============

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at 
  BEFORE UPDATE ON order_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============= SAMPLE DATA =============

-- Sample orders
INSERT INTO orders (
  id, user_id, restaurant_id, order_number, status, payment_status, delivery_type, priority,
  subtotal, tax_amount, delivery_fee, discount_amount, total_amount,
  customer_name, customer_phone, customer_email, delivery_address, delivery_notes,
  estimated_prep_time, special_instructions
) VALUES 
(
  uuid_generate_v4(), 'user-001', 'restaurant-001', 'ORD202411130001', 'DELIVERED', 'PAID', 'DELIVERY', 'NORMAL',
  180000, 18000, 25000, 0, 223000,
  'Nguyễn Văn An', '0901234567', 'an@email.com', '123 Nguyễn Thái Sơn, Gò Vấp, TP.HCM', 'Gọi chuông 2 lần',
  30, 'Không cay'
),
(
  uuid_generate_v4(), 'user-002', 'restaurant-001', 'ORD202411130002', 'PREPARING', 'PAID', 'PICKUP', 'HIGH',
  95000, 9500, 0, 10000, 94500,
  'Trần Thị Bình', '0912345678', 'binh@email.com', NULL, NULL,
  20, 'Extra cheese'
),
(
  uuid_generate_v4(), 'user-003', 'restaurant-002', 'ORD202411130003', 'PENDING', 'PENDING', 'DELIVERY', 'NORMAL',
  320000, 32000, 25000, 50000, 327000,
  'Lê Minh Cường', '0923456789', 'cuong@email.com', '456 Lê Văn Sỹ, Phú Nhuận, TP.HCM', 'Để ở bảo vệ tầng 1',
  45, 'Món chính không hành'
),
(
  uuid_generate_v4(), 'user-001', 'restaurant-003', 'ORD202411130004', 'READY', 'PAID', 'DINE_IN', 'URGENT',
  250000, 25000, 0, 0, 275000,
  'Nguyễn Văn An', '0901234567', 'an@email.com', NULL, NULL,
  15, 'Bàn số 12'
),
(
  uuid_generate_v4(), 'user-004', 'restaurant-001', 'ORD202411130005', 'CANCELLED', 'REFUNDED', 'DELIVERY', 'NORMAL',
  140000, 14000, 25000, 0, 179000,
  'Phạm Thị Dung', '0934567890', 'dung@email.com', '789 Cách Mạng Tháng 8, Tân Bình, TP.HCM', NULL,
  25, NULL
);

-- Get order IDs for sample data
DO $$
DECLARE
  order_1_id UUID;
  order_2_id UUID;
  order_3_id UUID;
  order_4_id UUID;
  order_5_id UUID;
BEGIN
  -- Get order IDs
  SELECT id INTO order_1_id FROM orders WHERE order_number = 'ORD202411130001';
  SELECT id INTO order_2_id FROM orders WHERE order_number = 'ORD202411130002';
  SELECT id INTO order_3_id FROM orders WHERE order_number = 'ORD202411130003';
  SELECT id INTO order_4_id FROM orders WHERE order_number = 'ORD202411130004';
  SELECT id INTO order_5_id FROM orders WHERE order_number = 'ORD202411130005';

  -- Sample order items for Order 1
  INSERT INTO order_items (order_id, product_id, product_name, product_description, category, unit_price, quantity, total_price, customizations, special_requests) VALUES
  (order_1_id, 'food-001', 'Phở Bò Tái', 'Phở bò tái truyền thống với bánh phở tươi', 'Phở', 65000, 2, 130000, '["Size lớn", "Thêm rau"]', 'Không hành tây'),
  (order_1_id, 'food-002', 'Chả cá Lã Vọng', 'Chả cá truyền thống Hà Nội', 'Món chính', 50000, 1, 50000, '[]', NULL);

  -- Sample order items for Order 2
  INSERT INTO order_items (order_id, product_id, product_name, product_description, category, unit_price, quantity, total_price, customizations, special_requests) VALUES
  (order_2_id, 'food-003', 'Pizza Margherita', 'Pizza cơ bản với phô mai mozzarella', 'Pizza', 95000, 1, 95000, '["Size M", "Extra cheese"]', 'Nướng giòn');

  -- Sample order items for Order 3
  INSERT INTO order_items (order_id, product_id, product_name, product_description, category, unit_price, quantity, total_price, customizations, special_requests) VALUES
  (order_3_id, 'food-004', 'Cơm tấm sườn nướng', 'Cơm tấm với sườn nướng và bì chả', 'Cơm', 80000, 2, 160000, '["Thêm trứng ốp la"]', 'Không mắm ruốc'),
  (order_3_id, 'food-005', 'Bánh mì thịt nướng', 'Bánh mì Việt Nam với thịt nướng', 'Bánh mì', 40000, 3, 120000, '["Không cilantro"]', NULL),
  (order_3_id, 'food-006', 'Trà đá chanh', 'Trà đá truyền thống với chanh tươi', 'Thức uống', 20000, 2, 40000, '["Ít đường"]', NULL);

  -- Sample order items for Order 4
  INSERT INTO order_items (order_id, product_id, product_name, product_description, category, unit_price, quantity, total_price, customizations, special_requests) VALUES
  (order_4_id, 'food-007', 'Lẩu Thái chua cay', 'Lẩu Thái truyền thống cho 2-3 người', 'Lẩu', 250000, 1, 250000, '["Level cay vừa", "Thêm rau"]', 'Bàn số 12');

  -- Sample order items for Order 5 (cancelled)
  INSERT INTO order_items (order_id, product_id, product_name, product_description, category, unit_price, quantity, total_price, customizations, special_requests) VALUES
  (order_5_id, 'food-008', 'Bún bò Huế', 'Bún bò Huế cay truyền thống', 'Bún', 70000, 2, 140000, '["Ít cay"]', NULL);

END $$;

-- Sample order status history
INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by, reason) 
SELECT 
  o.id,
  NULL,
  'PENDING',
  o.user_id,
  'Order created'
FROM orders o;

-- Add some status progression for delivered order
DO $$
DECLARE
  delivered_order_id UUID;
BEGIN
  SELECT id INTO delivered_order_id FROM orders WHERE order_number = 'ORD202411130001';
  
  INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by, reason) VALUES
  (delivered_order_id, 'PENDING', 'CONFIRMED', 'admin-001', 'Order confirmed'),
  (delivered_order_id, 'CONFIRMED', 'PREPARING', 'chef-001', 'Started cooking'),
  (delivered_order_id, 'PREPARING', 'READY', 'chef-001', 'Food ready'),
  (delivered_order_id, 'READY', 'OUT_FOR_DELIVERY', 'driver-001', 'Out for delivery'),
  (delivered_order_id, 'OUT_FOR_DELIVERY', 'DELIVERED', 'driver-001', 'Successfully delivered');
END $$;

-- ============= VIEWS FOR COMMON QUERIES =============

-- Order summary view
CREATE OR REPLACE VIEW order_summary AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.payment_status,
  o.delivery_type,
  o.customer_name,
  o.customer_phone,
  o.total_amount,
  o.created_at,
  o.delivery_time,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.status, o.payment_status, o.delivery_type, 
         o.customer_name, o.customer_phone, o.total_amount, o.created_at, o.delivery_time;

-- Order statistics view
CREATE OR REPLACE VIEW order_statistics AS
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed_orders,
  COUNT(CASE WHEN status = 'PREPARING' THEN 1 END) as preparing_orders,
  COUNT(CASE WHEN status = 'READY' THEN 1 END) as ready_orders,
  COUNT(CASE WHEN status = 'OUT_FOR_DELIVERY' THEN 1 END) as out_for_delivery_orders,
  COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered_orders,
  COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
  COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total_amount ELSE 0 END), 0) as total_revenue,
  COALESCE(AVG(CASE WHEN status = 'DELIVERED' THEN total_amount END), 0) as average_order_value,
  COALESCE(AVG(estimated_prep_time), 0) as average_prep_time
FROM orders;

-- Display success message
SELECT 'Order Service database schema created successfully!' as status;

-- Display sample data counts
SELECT 
  'orders' as table_name, COUNT(*) as record_count FROM orders
UNION ALL
SELECT 
  'order_items' as table_name, COUNT(*) as record_count FROM order_items
UNION ALL
SELECT 
  'order_status_history' as table_name, COUNT(*) as record_count FROM order_status_history;