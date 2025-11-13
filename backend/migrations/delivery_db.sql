-- ============================================
-- DELIVERY SERVICE DATABASE SCHEMA
-- ============================================
-- Version: 1.0.0
-- Created: 2024
-- Description: Complete database schema for delivery service
--              including drivers, deliveries, tracking, routes, and zones

-- Create delivery database
-- CREATE DATABASE delivery_db;
-- \c delivery_db;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geographical data
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================
-- ENUMS SECTION
-- ============================================

-- Driver status enumeration
CREATE TYPE driver_status_enum AS ENUM (
    'OFFLINE',
    'AVAILABLE', 
    'BUSY',
    'ON_DELIVERY',
    'BREAK',
    'SUSPENDED'
);

-- Vehicle type enumeration
CREATE TYPE vehicle_type_enum AS ENUM (
    'MOTORBIKE',
    'BICYCLE',
    'CAR',
    'TRUCK',
    'WALKING'
);

-- Delivery status enumeration
CREATE TYPE delivery_status_enum AS ENUM (
    'PENDING',
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'FAILED',
    'CANCELLED',
    'RETURNED'
);

-- Delivery priority enumeration
CREATE TYPE delivery_priority_enum AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);

-- Payment method enumeration
CREATE TYPE payment_method_enum AS ENUM (
    'CASH',
    'CARD',
    'DIGITAL_WALLET',
    'PREPAID'
);

-- Tracking event type enumeration
CREATE TYPE tracking_event_type_enum AS ENUM (
    'ORDER_PLACED',
    'DRIVER_ASSIGNED',
    'DRIVER_EN_ROUTE',
    'ARRIVED_AT_RESTAURANT',
    'ORDER_PICKED_UP',
    'EN_ROUTE_TO_CUSTOMER',
    'ARRIVED_AT_DESTINATION',
    'DELIVERED',
    'DELIVERY_FAILED',
    'CANCELLED',
    'RETURNED'
);

-- Route status enumeration
CREATE TYPE route_status_enum AS ENUM (
    'PLANNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);

-- ============================================
-- MAIN TABLES SECTION
-- ============================================

-- Drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Reference to user service
    driver_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    status driver_status_enum DEFAULT 'OFFLINE',
    
    -- Vehicle information
    vehicle_type vehicle_type_enum NOT NULL,
    vehicle_plate VARCHAR(20) NOT NULL,
    vehicle_model VARCHAR(50),
    vehicle_color VARCHAR(30),
    
    -- License and documents
    license_number VARCHAR(50) NOT NULL,
    license_expiry DATE NOT NULL,
    identity_number VARCHAR(30) NOT NULL,
    
    -- Location tracking (using PostGIS point type)
    current_location POINT,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    last_location_update TIMESTAMP,
    
    -- Work information
    zone_coverage JSONB DEFAULT '[]'::jsonb, -- Array of zone IDs
    working_start_time TIME DEFAULT '06:00:00',
    working_end_time TIME DEFAULT '22:00:00',
    working_days JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'::jsonb,
    
    -- Performance metrics
    rating DECIMAL(3,2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    average_delivery_time DECIMAL(10,2) DEFAULT 0, -- in minutes
    total_distance DECIMAL(10,2) DEFAULT 0, -- in kilometers
    
    -- Financial information
    commission_rate DECIMAL(5,4) DEFAULT 0.15 CHECK (commission_rate >= 0 AND commission_rate <= 1),
    earnings_today DECIMAL(10,2) DEFAULT 0,
    earnings_this_month DECIMAL(10,2) DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    
    -- Status tracking
    online_since TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata and timestamps
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_license_expiry CHECK (license_expiry > CURRENT_DATE),
    CONSTRAINT valid_success_rate CHECK (successful_deliveries <= total_deliveries),
    CONSTRAINT valid_coordinates CHECK (
        (current_latitude IS NULL AND current_longitude IS NULL) OR
        (current_latitude BETWEEN -90 AND 90 AND current_longitude BETWEEN -180 AND 180)
    )
);

-- Deliveries table
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL, -- Reference to order service
    customer_id UUID NOT NULL, -- Reference to user service
    restaurant_id UUID NOT NULL, -- Reference to partner service
    partner_id UUID NOT NULL, -- Reference to partner service
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    
    -- Status and priority
    status delivery_status_enum DEFAULT 'PENDING',
    priority delivery_priority_enum DEFAULT 'NORMAL',
    
    -- Pickup information
    pickup_address TEXT NOT NULL,
    pickup_location POINT,
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    pickup_contact_name VARCHAR(100) NOT NULL,
    pickup_contact_phone VARCHAR(15) NOT NULL,
    pickup_instructions TEXT,
    
    -- Delivery information
    delivery_address TEXT NOT NULL,
    delivery_location POINT,
    delivery_latitude DECIMAL(10, 8) NOT NULL,
    delivery_longitude DECIMAL(11, 8) NOT NULL,
    delivery_contact_name VARCHAR(100) NOT NULL,
    delivery_contact_phone VARCHAR(15) NOT NULL,
    delivery_instructions TEXT,
    
    -- Timing information
    estimated_pickup_time TIMESTAMP,
    estimated_delivery_time TIMESTAMP,
    actual_pickup_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    delivery_window_start TIMESTAMP,
    delivery_window_end TIMESTAMP,
    
    -- Financial information
    delivery_fee DECIMAL(10,2) NOT NULL CHECK (delivery_fee >= 0),
    driver_commission DECIMAL(10,2) DEFAULT 0 CHECK (driver_commission >= 0),
    platform_fee DECIMAL(10,2) DEFAULT 0 CHECK (platform_fee >= 0),
    payment_method payment_method_enum NOT NULL,
    cash_to_collect DECIMAL(10,2) DEFAULT 0,
    
    -- Distance and route information
    estimated_distance DECIMAL(10,2) NOT NULL, -- in kilometers
    actual_distance DECIMAL(10,2), -- in kilometers
    estimated_duration INTEGER NOT NULL, -- in minutes
    actual_duration INTEGER, -- in minutes
    route_polyline TEXT, -- Encoded polyline for route
    
    -- Items information
    items_count INTEGER NOT NULL CHECK (items_count > 0),
    total_weight DECIMAL(8,2), -- in kilograms
    special_instructions TEXT,
    fragile_items BOOLEAN DEFAULT FALSE,
    
    -- Proof of delivery
    delivery_photo_url TEXT,
    delivery_signature TEXT,
    delivery_notes TEXT,
    customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
    customer_feedback TEXT,
    
    -- Failure information
    failure_reason TEXT,
    return_reason TEXT,
    failed_attempts INTEGER DEFAULT 0,
    
    -- Metadata and timestamps
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_pickup_coordinates CHECK (
        pickup_latitude BETWEEN -90 AND 90 AND pickup_longitude BETWEEN -180 AND 180
    ),
    CONSTRAINT valid_delivery_coordinates CHECK (
        delivery_latitude BETWEEN -90 AND 90 AND delivery_longitude BETWEEN -180 AND 180
    ),
    CONSTRAINT valid_delivery_window CHECK (
        delivery_window_start IS NULL OR delivery_window_end IS NULL OR 
        delivery_window_start < delivery_window_end
    ),
    CONSTRAINT valid_timing CHECK (
        actual_pickup_time IS NULL OR actual_delivery_time IS NULL OR 
        actual_pickup_time <= actual_delivery_time
    )
);

-- Delivery assignments table
CREATE TABLE delivery_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    
    -- Assignment timing
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    -- Assignment details
    estimated_pickup_time TIMESTAMP NOT NULL,
    estimated_delivery_time TIMESTAMP NOT NULL,
    offered_commission DECIMAL(10,2) NOT NULL,
    
    -- Response information
    is_accepted BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    response_time INTEGER, -- in seconds
    auto_assigned BOOLEAN DEFAULT FALSE,
    
    -- Metadata and timestamps
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_assignment_response CHECK (
        (is_accepted = TRUE AND accepted_at IS NOT NULL AND rejected_at IS NULL) OR
        (is_accepted = FALSE AND rejected_at IS NOT NULL)
    ),
    CONSTRAINT valid_assignment_timing CHECK (estimated_pickup_time < estimated_delivery_time),
    CONSTRAINT valid_expiry CHECK (expires_at > assigned_at)
);

-- Tracking events table
CREATE TABLE tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    
    -- Event information
    event_type tracking_event_type_enum NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Location information
    location POINT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    
    -- Event details
    description TEXT NOT NULL,
    notes TEXT,
    photo_url TEXT,
    
    -- System information
    created_by VARCHAR(50) DEFAULT 'system', -- 'system', 'driver', 'customer', 'admin'
    source VARCHAR(50) DEFAULT 'api', -- 'mobile_app', 'web_admin', 'api', 'gps'
    
    -- Metadata and timestamps
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_event_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
);

-- Delivery routes table (for route optimization)
CREATE TABLE delivery_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    route_date DATE NOT NULL,
    
    -- Route information
    deliveries JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of delivery IDs
    optimized_order JSONB DEFAULT '[]'::jsonb, -- Array of integers (delivery sequence)
    route_polyline TEXT,
    
    -- Route statistics
    total_distance DECIMAL(10,2) DEFAULT 0,
    total_duration INTEGER DEFAULT 0, -- in minutes
    total_deliveries INTEGER DEFAULT 0,
    completed_deliveries INTEGER DEFAULT 0,
    estimated_earnings DECIMAL(10,2) DEFAULT 0,
    actual_earnings DECIMAL(10,2) DEFAULT 0,
    
    -- Status and timing
    status route_status_enum DEFAULT 'PLANNED',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Metadata and timestamps
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_route_completion CHECK (completed_deliveries <= total_deliveries),
    CONSTRAINT valid_route_timing CHECK (
        started_at IS NULL OR completed_at IS NULL OR started_at <= completed_at
    )
);

-- Delivery zones table
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Geographic boundaries (using PostGIS polygon)
    boundaries POLYGON,
    center_point POINT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Operational information
    base_delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_time_estimate INTEGER DEFAULT 30, -- in minutes
    max_delivery_distance DECIMAL(10,2) DEFAULT 15, -- in kilometers
    available_vehicle_types JSONB DEFAULT '["MOTORBIKE","CAR","BICYCLE"]'::jsonb,
    
    -- Coverage information
    covered_areas JSONB DEFAULT '[]'::jsonb, -- Array of area names
    postal_codes JSONB DEFAULT '[]'::jsonb, -- Array of postal codes
    
    -- Operational hours
    operating_hours JSONB DEFAULT '{
        "monday": {"start": "06:00", "end": "23:59"},
        "tuesday": {"start": "06:00", "end": "23:59"},
        "wednesday": {"start": "06:00", "end": "23:59"},
        "thursday": {"start": "06:00", "end": "23:59"},
        "friday": {"start": "06:00", "end": "23:59"},
        "saturday": {"start": "06:00", "end": "23:59"},
        "sunday": {"start": "06:00", "end": "23:59"}
    }'::jsonb,
    
    -- Performance metrics
    average_delivery_time DECIMAL(10,2) DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    
    -- Metadata and timestamps
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Driver ratings table (detailed rating history)
CREATE TABLE driver_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL, -- Reference to user service
    
    -- Rating information
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    rating_categories JSONB DEFAULT '{}'::jsonb, -- e.g., {"speed": 5, "politeness": 4, "care": 5}
    
    -- Context information
    delivery_time_rating INTEGER CHECK (delivery_time_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
    
    -- Metadata and timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_delivery_rating UNIQUE (delivery_id, customer_id)
);

-- Delivery notifications table
CREATE TABLE delivery_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL, -- User ID who should receive notification
    recipient_type VARCHAR(20) NOT NULL, -- 'CUSTOMER', 'DRIVER', 'RESTAURANT', 'ADMIN'
    
    -- Notification content
    type VARCHAR(50) NOT NULL, -- 'NEW_DELIVERY', 'STATUS_UPDATE', 'LOCATION_UPDATE', etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Delivery information
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    is_sent BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    
    -- Delivery channels
    push_notification BOOLEAN DEFAULT TRUE,
    email_notification BOOLEAN DEFAULT FALSE,
    sms_notification BOOLEAN DEFAULT FALSE,
    
    -- Metadata and timestamps
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT valid_recipient_type CHECK (recipient_type IN ('CUSTOMER', 'DRIVER', 'RESTAURANT', 'ADMIN'))
);

-- ============================================
-- INDEXES SECTION
-- ============================================

-- Driver indexes
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_vehicle_type ON drivers(vehicle_type);
CREATE INDEX idx_drivers_rating ON drivers(rating DESC);
CREATE INDEX idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX idx_drivers_active ON drivers(status, last_active) WHERE status IN ('AVAILABLE', 'BUSY', 'ON_DELIVERY');
CREATE INDEX idx_drivers_email ON drivers(email);
CREATE INDEX idx_drivers_phone ON drivers(phone);
CREATE INDEX idx_drivers_code ON drivers(driver_code);

-- Delivery indexes
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX idx_deliveries_restaurant ON deliveries(restaurant_id);
CREATE INDEX idx_deliveries_partner ON deliveries(partner_id);
CREATE INDEX idx_deliveries_order ON deliveries(order_id);
CREATE INDEX idx_deliveries_priority ON deliveries(priority);
CREATE INDEX idx_deliveries_created ON deliveries(created_at DESC);
CREATE INDEX idx_deliveries_pickup_location ON deliveries USING GIST(pickup_location);
CREATE INDEX idx_deliveries_delivery_location ON deliveries USING GIST(delivery_location);
CREATE INDEX idx_deliveries_active ON deliveries(status, created_at) WHERE status IN ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT');

-- Assignment indexes
CREATE INDEX idx_assignments_delivery ON delivery_assignments(delivery_id);
CREATE INDEX idx_assignments_driver ON delivery_assignments(driver_id);
CREATE INDEX idx_assignments_status ON delivery_assignments(is_accepted, assigned_at);
CREATE INDEX idx_assignments_expires ON delivery_assignments(expires_at) WHERE is_accepted = FALSE;

-- Tracking event indexes
CREATE INDEX idx_tracking_delivery ON tracking_events(delivery_id, timestamp);
CREATE INDEX idx_tracking_driver ON tracking_events(driver_id, timestamp);
CREATE INDEX idx_tracking_type ON tracking_events(event_type, timestamp);
CREATE INDEX idx_tracking_location ON tracking_events USING GIST(location);

-- Route indexes
CREATE INDEX idx_routes_driver ON delivery_routes(driver_id, route_date);
CREATE INDEX idx_routes_status ON delivery_routes(status, route_date);
CREATE INDEX idx_routes_date ON delivery_routes(route_date DESC);

-- Zone indexes
CREATE INDEX idx_zones_active ON delivery_zones(is_active);
CREATE INDEX idx_zones_boundaries ON delivery_zones USING GIST(boundaries);
CREATE INDEX idx_zones_center ON delivery_zones USING GIST(center_point);

-- Rating indexes
CREATE INDEX idx_ratings_driver ON driver_ratings(driver_id, created_at DESC);
CREATE INDEX idx_ratings_delivery ON driver_ratings(delivery_id);
CREATE INDEX idx_ratings_customer ON driver_ratings(customer_id);

-- Notification indexes
CREATE INDEX idx_notifications_recipient ON delivery_notifications(recipient_id, recipient_type);
CREATE INDEX idx_notifications_delivery ON delivery_notifications(delivery_id);
CREATE INDEX idx_notifications_unread ON delivery_notifications(recipient_id) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_unsent ON delivery_notifications(created_at) WHERE is_sent = FALSE;

-- Full-text search indexes
CREATE INDEX idx_drivers_search ON drivers USING GIN(to_tsvector('english', full_name || ' ' || email || ' ' || phone));
CREATE INDEX idx_deliveries_search ON deliveries USING GIN(to_tsvector('english', pickup_address || ' ' || delivery_address));

-- ============================================
-- TRIGGERS SECTION
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON delivery_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON delivery_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON delivery_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update driver statistics
CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update driver statistics when a delivery is completed
    IF NEW.status = 'DELIVERED' AND (OLD.status IS NULL OR OLD.status != 'DELIVERED') THEN
        UPDATE drivers 
        SET 
            total_deliveries = total_deliveries + 1,
            successful_deliveries = successful_deliveries + 1,
            total_distance = total_distance + COALESCE(NEW.actual_distance, NEW.estimated_distance),
            earnings_today = earnings_today + COALESCE(NEW.driver_commission, 0),
            earnings_this_month = earnings_this_month + COALESCE(NEW.driver_commission, 0),
            total_earnings = total_earnings + COALESCE(NEW.driver_commission, 0)
        WHERE id = NEW.driver_id;
        
        -- Update average delivery time if we have actual times
        IF NEW.actual_pickup_time IS NOT NULL AND NEW.actual_delivery_time IS NOT NULL THEN
            UPDATE drivers 
            SET average_delivery_time = (
                SELECT AVG(EXTRACT(EPOCH FROM (actual_delivery_time - created_at))/60)
                FROM deliveries 
                WHERE driver_id = NEW.driver_id AND status = 'DELIVERED'
            )
            WHERE id = NEW.driver_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply driver stats trigger
CREATE TRIGGER update_driver_statistics
    AFTER UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION update_driver_stats();

-- Function to update location point from lat/lng
CREATE OR REPLACE FUNCTION update_location_point()
RETURNS TRIGGER AS $$
BEGIN
    -- Update location point for drivers
    IF TG_TABLE_NAME = 'drivers' THEN
        IF NEW.current_latitude IS NOT NULL AND NEW.current_longitude IS NOT NULL THEN
            NEW.current_location = ST_SetSRID(ST_MakePoint(NEW.current_longitude, NEW.current_latitude), 4326);
        END IF;
    END IF;
    
    -- Update location points for deliveries
    IF TG_TABLE_NAME = 'deliveries' THEN
        NEW.pickup_location = ST_SetSRID(ST_MakePoint(NEW.pickup_longitude, NEW.pickup_latitude), 4326);
        NEW.delivery_location = ST_SetSRID(ST_MakePoint(NEW.delivery_longitude, NEW.delivery_latitude), 4326);
    END IF;
    
    -- Update location point for tracking events
    IF TG_TABLE_NAME = 'tracking_events' THEN
        IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
            NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply location triggers
CREATE TRIGGER update_driver_location_point
    BEFORE INSERT OR UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_location_point();

CREATE TRIGGER update_delivery_location_points
    BEFORE INSERT OR UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION update_location_point();

CREATE TRIGGER update_tracking_location_point
    BEFORE INSERT OR UPDATE ON tracking_events
    FOR EACH ROW EXECUTE FUNCTION update_location_point();

-- ============================================
-- VIEWS SECTION
-- ============================================

-- Active deliveries view
CREATE VIEW active_deliveries AS
SELECT 
    d.*,
    dr.full_name as driver_name,
    dr.phone as driver_phone,
    dr.vehicle_type,
    dr.vehicle_plate,
    dr.current_latitude as driver_latitude,
    dr.current_longitude as driver_longitude
FROM deliveries d
LEFT JOIN drivers dr ON d.driver_id = dr.id
WHERE d.status IN ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT');

-- Driver performance view
CREATE VIEW driver_performance AS
SELECT 
    d.id,
    d.driver_code,
    d.full_name,
    d.status,
    d.rating,
    d.total_deliveries,
    d.successful_deliveries,
    CASE 
        WHEN d.total_deliveries > 0 
        THEN ROUND((d.successful_deliveries::DECIMAL / d.total_deliveries) * 100, 2)
        ELSE 0 
    END as success_rate,
    d.average_delivery_time,
    d.total_distance,
    d.earnings_today,
    d.earnings_this_month,
    d.total_earnings,
    d.last_active,
    COUNT(CASE WHEN del.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT') THEN 1 END) as current_active_deliveries
FROM drivers d
LEFT JOIN deliveries del ON d.id = del.driver_id AND del.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
GROUP BY d.id, d.driver_code, d.full_name, d.status, d.rating, d.total_deliveries, 
         d.successful_deliveries, d.average_delivery_time, d.total_distance, 
         d.earnings_today, d.earnings_this_month, d.total_earnings, d.last_active;

-- Delivery analytics view
CREATE VIEW delivery_analytics AS
SELECT 
    DATE(created_at) as delivery_date,
    COUNT(*) as total_deliveries,
    COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as completed_deliveries,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_deliveries,
    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_deliveries,
    AVG(CASE WHEN actual_delivery_time IS NOT NULL AND created_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (actual_delivery_time - created_at))/60 END) as avg_delivery_time,
    SUM(delivery_fee) as total_revenue,
    AVG(delivery_fee) as avg_delivery_fee,
    SUM(driver_commission) as total_driver_commission
FROM deliveries
GROUP BY DATE(created_at)
ORDER BY delivery_date DESC;

-- ============================================
-- FUNCTIONS SECTION
-- ============================================

-- Function to get nearby drivers
CREATE OR REPLACE FUNCTION get_nearby_drivers(
    target_lat DECIMAL(10,8),
    target_lng DECIMAL(11,8),
    max_distance_km DECIMAL DEFAULT 10.0,
    vehicle_types VARCHAR[] DEFAULT ARRAY['MOTORBIKE', 'CAR', 'BICYCLE']
)
RETURNS TABLE (
    driver_id UUID,
    driver_name VARCHAR(100),
    vehicle_type vehicle_type_enum,
    distance_km DECIMAL,
    rating DECIMAL(3,2),
    current_deliveries BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.full_name,
        d.vehicle_type,
        ROUND(
            ST_Distance(
                ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography,
                d.current_location::geography
            ) / 1000.0, 2
        ) as distance_km,
        d.rating,
        COUNT(del.id) as current_deliveries
    FROM drivers d
    LEFT JOIN deliveries del ON d.id = del.driver_id 
        AND del.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
    WHERE d.status = 'AVAILABLE'
        AND d.current_location IS NOT NULL
        AND d.vehicle_type = ANY(vehicle_types::vehicle_type_enum[])
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography,
            d.current_location::geography,
            max_distance_km * 1000
        )
    GROUP BY d.id, d.full_name, d.vehicle_type, d.rating, d.current_location
    ORDER BY distance_km ASC, d.rating DESC, current_deliveries ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate delivery fee
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
    pickup_lat DECIMAL(10,8),
    pickup_lng DECIMAL(11,8),
    delivery_lat DECIMAL(10,8),
    delivery_lng DECIMAL(11,8),
    priority delivery_priority_enum DEFAULT 'NORMAL',
    items_count INTEGER DEFAULT 1,
    total_weight DECIMAL DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    distance_km DECIMAL;
    base_fee DECIMAL := 2.50;
    distance_fee DECIMAL;
    weight_fee DECIMAL := 0;
    item_fee DECIMAL := 0;
    priority_multiplier DECIMAL := 1.0;
    surge_multiplier DECIMAL := 1.0;
    total_fee DECIMAL;
BEGIN
    -- Calculate distance
    distance_km := ST_Distance(
        ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(delivery_lng, delivery_lat), 4326)::geography
    ) / 1000.0;
    
    -- Calculate distance fee
    distance_fee := distance_km * 0.80;
    
    -- Calculate weight fee (extra charge for weight > 5kg)
    IF total_weight > 5 THEN
        weight_fee := (total_weight - 5) * 0.50;
    END IF;
    
    -- Calculate item fee (extra charge for items > 5)
    IF items_count > 5 THEN
        item_fee := (items_count - 5) * 0.25;
    END IF;
    
    -- Apply priority multiplier
    CASE priority
        WHEN 'HIGH' THEN priority_multiplier := 1.2;
        WHEN 'URGENT' THEN priority_multiplier := 1.5;
        ELSE priority_multiplier := 1.0;
    END CASE;
    
    -- Check for surge pricing (peak hours)
    IF EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 11 AND 14 
       OR EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 18 AND 21 THEN
        surge_multiplier := 1.25;
    END IF;
    
    -- Calculate total fee
    total_fee := (base_fee + distance_fee + weight_fee + item_fee) * priority_multiplier * surge_multiplier;
    
    RETURN jsonb_build_object(
        'base_fee', base_fee,
        'distance_fee', ROUND(distance_fee, 2),
        'weight_fee', ROUND(weight_fee, 2),
        'item_fee', ROUND(item_fee, 2),
        'priority_multiplier', priority_multiplier,
        'surge_multiplier', surge_multiplier,
        'distance_km', ROUND(distance_km, 2),
        'total_fee', ROUND(total_fee, 2)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA SECTION (for development)
-- ============================================

-- Insert sample delivery zones
INSERT INTO delivery_zones (name, description, base_delivery_fee, delivery_time_estimate) VALUES
('Downtown', 'Central business district', 3.00, 25),
('North District', 'Northern residential area', 2.50, 35),
('South District', 'Southern suburban area', 2.75, 40),
('East District', 'Eastern commercial zone', 3.25, 30),
('West District', 'Western residential area', 2.50, 35);

-- ============================================
-- PERMISSIONS SECTION
-- ============================================

-- Create roles
CREATE ROLE delivery_service_app;
CREATE ROLE delivery_service_readonly;

-- Grant permissions to app role
GRANT CONNECT ON DATABASE delivery_db TO delivery_service_app;
GRANT USAGE ON SCHEMA public TO delivery_service_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO delivery_service_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO delivery_service_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO delivery_service_app;

-- Grant read-only permissions
GRANT CONNECT ON DATABASE delivery_db TO delivery_service_readonly;
GRANT USAGE ON SCHEMA public TO delivery_service_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO delivery_service_readonly;

-- ============================================
-- COMMENTS SECTION
-- ============================================

COMMENT ON DATABASE delivery_db IS 'Database for delivery service management system';

COMMENT ON TABLE drivers IS 'Store driver information, location, and performance metrics';
COMMENT ON TABLE deliveries IS 'Store delivery orders and their lifecycle information';
COMMENT ON TABLE delivery_assignments IS 'Track driver assignments to deliveries';
COMMENT ON TABLE tracking_events IS 'Store real-time tracking events for deliveries';
COMMENT ON TABLE delivery_routes IS 'Store optimized delivery routes for drivers';
COMMENT ON TABLE delivery_zones IS 'Define geographical zones for delivery operations';
COMMENT ON TABLE driver_ratings IS 'Store detailed rating history for drivers';
COMMENT ON TABLE delivery_notifications IS 'Store notifications sent to users';

COMMENT ON FUNCTION get_nearby_drivers IS 'Find available drivers within specified distance';
COMMENT ON FUNCTION calculate_delivery_fee IS 'Calculate delivery fee based on distance and other factors';

-- ============================================
-- END OF SCHEMA
-- ============================================