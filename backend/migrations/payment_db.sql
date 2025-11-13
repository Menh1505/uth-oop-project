-- Payment Service Database Schema
-- This file creates the payment_db database and its tables

-- Create database (if not exists)
-- CREATE DATABASE payment_db;

-- Connect to payment_db
\c payment_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= PAYMENTS TABLE =============
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN (
        'CREDIT_CARD', 'DEBIT_CARD', 'APPLE_PAY', 'BANK_TRANSFER', 'E_WALLET', 'CASH'
    )),
    payment_gateway VARCHAR(50) NOT NULL CHECK (payment_gateway IN (
        'APPLE_PAY', 'PAYOS', 'MOCK_GATEWAY'
    )),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'
    )),
    
    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    
    -- Payment details
    description TEXT,
    payment_intent_id VARCHAR(255),
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Apple Pay specific fields
    apple_pay_token TEXT,
    
    -- PayOS specific fields
    payos_order_code VARCHAR(255),
    payos_items JSONB,
    
    -- URLs for redirects
    return_url TEXT,
    cancel_url TEXT,
    
    -- Financial fields
    fee_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(15,2),
    tax_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Indexes
    CONSTRAINT unique_gateway_transaction UNIQUE (payment_gateway, gateway_transaction_id),
    CONSTRAINT unique_payos_order_code UNIQUE (payos_order_code)
);

-- ============= TRANSACTIONS TABLE =============
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'PAYMENT', 'REFUND', 'CHARGEBACK', 'FEE'
    )),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    
    -- Gateway information
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'
);

-- ============= REFUND_REQUESTS TABLE =============
CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    
    -- Refund details
    refund_amount DECIMAL(15,2) NOT NULL CHECK (refund_amount > 0),
    refund_reason TEXT NOT NULL,
    refund_type VARCHAR(50) NOT NULL CHECK (refund_type IN (
        'FULL', 'PARTIAL', 'DISPUTE', 'ERROR'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED'
    )),
    
    -- Processing information
    gateway_refund_id VARCHAR(255),
    gateway_response JSONB,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- ============= PAYMENT_WEBHOOKS TABLE =============
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    -- Processing status
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Signature verification
    signature VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE
);

-- ============= INDEXES =============

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Refund requests indexes
CREATE INDEX IF NOT EXISTS idx_refund_requests_payment_id ON refund_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at);

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_gateway ON payment_webhooks(gateway);
CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_webhooks_payment_id ON payment_webhooks(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_at ON payment_webhooks(created_at);

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
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refund_requests_updated_at 
    BEFORE UPDATE ON refund_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at 
    BEFORE UPDATE ON payment_webhooks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============= SAMPLE DATA FOR TESTING =============

-- Insert sample payments (for development/testing only)
INSERT INTO payments (
    user_id, order_id, payment_method, payment_gateway, amount, currency,
    customer_name, customer_email, description, status
) VALUES 
(
    'user123', 'order456', 'CREDIT_CARD', 'MOCK_GATEWAY', 250000.00, 'VND',
    'Nguyen Van A', 'nguyenvana@example.com', 'Payment for food order #456', 'COMPLETED'
),
(
    'user124', 'order457', 'APPLE_PAY', 'APPLE_PAY', 150000.00, 'VND',
    'Tran Thi B', 'tranthib@example.com', 'Apple Pay payment for order #457', 'PENDING'
),
(
    'user125', 'order458', 'BANK_TRANSFER', 'PAYOS', 320000.00, 'VND',
    'Le Van C', 'levanc@example.com', 'PayOS bank transfer for order #458', 'PROCESSING'
)
ON CONFLICT DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (
    payment_id, transaction_type, amount, currency, status, description
) SELECT 
    p.id, 'PAYMENT', p.amount, p.currency, 'COMPLETED', 'Initial payment transaction'
FROM payments p 
WHERE p.status = 'COMPLETED'
ON CONFLICT DO NOTHING;

-- Insert sample refund request
INSERT INTO refund_requests (
    payment_id, user_id, refund_amount, refund_reason, refund_type, status
) SELECT 
    p.id, p.user_id, 50000.00, 'Customer requested partial refund due to order modification', 'PARTIAL', 'PENDING'
FROM payments p 
WHERE p.status = 'COMPLETED' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Display table information
SELECT 'Database schema created successfully!' as status;
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('payments', 'transactions', 'refund_requests', 'payment_webhooks')
ORDER BY table_name, ordinal_position;