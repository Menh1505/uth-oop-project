-- Admin Database Schema
-- Administrative data and system monitoring

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- System health monitoring
CREATE TABLE system_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'unknown' CHECK (status IN ('healthy', 'unhealthy', 'unknown')),
    response_time INTEGER, -- milliseconds
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin dashboard stats cache
CREATE TABLE dashboard_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- Service logs (for monitoring)
CREATE TABLE service_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    level VARCHAR(20) DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API rate limiting (if needed)
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- IP or user ID
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    window_end TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes
CREATE INDEX idx_system_health_service ON system_health(service_name);
CREATE INDEX idx_system_health_status ON system_health(status);
CREATE INDEX idx_system_health_checked_at ON system_health(checked_at);
CREATE INDEX idx_dashboard_stats_metric ON dashboard_stats(metric_name);
CREATE INDEX idx_dashboard_stats_expires ON dashboard_stats(expires_at);
CREATE INDEX idx_service_logs_service ON service_logs(service_name);
CREATE INDEX idx_service_logs_level ON service_logs(level);
CREATE INDEX idx_service_logs_created_at ON service_logs(created_at);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start, window_end);

-- Clean up old data periodically
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete old system health checks (keep last 1000 per service)
    DELETE FROM system_health
    WHERE id NOT IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY service_name ORDER BY checked_at DESC) as rn
            FROM system_health
        ) t WHERE rn <= 1000
    );

    -- Delete old service logs (keep last 30 days)
    DELETE FROM service_logs WHERE created_at < NOW() - INTERVAL '30 days';

    -- Delete expired dashboard stats
    DELETE FROM dashboard_stats WHERE expires_at < NOW();

    -- Delete old rate limit records (keep last 1 hour)
    DELETE FROM rate_limits WHERE window_end < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create a function to run cleanup periodically (would be called by cron)
-- This is just a placeholder - actual scheduling would be done externally
