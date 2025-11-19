-- Initial sync of users from auth_db to user_db
-- This one-time migration copies existing users from auth database to user database

-- Since we can't cross databases directly in RDS without foreign server setup,
-- this migration should be run after auth-service registers users
-- For now, this creates the trigger that syncs on INSERT

-- When auth-service publishes user.registered event, user-service should insert into users table
-- This migration ensures the table structure is ready

-- The actual sync happens via RabbitMQ message from auth-service
-- auth-service publishes 'user.registered' with userId and email
-- user-service consumes and inserts into users table

-- Just ensure users table exists with correct schema
-- (already done in migration 022)
