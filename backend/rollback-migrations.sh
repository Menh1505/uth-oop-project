#!/bin/bash

# Database Migration Rollback Script
# This script provides rollback functionality for migrations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-fitfood_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-password}"

echo -e "${YELLOW}FitFood Database Rollback Tool${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Function to drop all tables and start fresh
reset_database() {
    echo -e "${YELLOW}Resetting database (dropping all tables)...${NC}"
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
    -- Drop all tables in correct order (reverse of creation due to foreign keys)
    DROP TABLE IF EXISTS meal_foods CASCADE;
    DROP TABLE IF EXISTS meals CASCADE;
    DROP TABLE IF EXISTS exercises CASCADE;
    DROP TABLE IF EXISTS user_progress CASCADE;
    DROP TABLE IF EXISTS nutrition_logs CASCADE;
    DROP TABLE IF EXISTS user_preferences CASCADE;
    DROP TABLE IF EXISTS exercise_templates CASCADE;
    DROP TABLE IF EXISTS recommendations CASCADE;
    DROP TABLE IF EXISTS payments CASCADE;
    DROP TABLE IF EXISTS user_goals CASCADE;
    DROP TABLE IF EXISTS goals CASCADE;
    DROP TABLE IF EXISTS foods CASCADE;
    DROP TABLE IF EXISTS subscriptions CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS schema_migrations CASCADE;
    
    -- Drop functions
    DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    DROP FUNCTION IF EXISTS update_meal_totals() CASCADE;
    
    -- Drop any remaining sequences
    DROP SEQUENCE IF EXISTS schema_migrations_id_seq CASCADE;
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database reset successfully${NC}"
    else
        echo -e "${RED}✗ Failed to reset database${NC}"
        exit 1
    fi
}

# Function to rollback specific migration
rollback_migration() {
    local migration_file=$1
    echo -e "${YELLOW}Rolling back migration: $migration_file${NC}"
    
    # Remove from migration tracking
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DELETE FROM schema_migrations WHERE migration_file = '$migration_file';"
    
    echo -e "${GREEN}✓ Removed $migration_file from migration tracking${NC}"
    echo -e "${YELLOW}Note: You may need to manually drop tables/functions created by this migration${NC}"
}

# Function to show migration status
show_status() {
    echo -e "${YELLOW}Migration Status:${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT migration_file, executed_at 
    FROM schema_migrations 
    ORDER BY executed_at;" 2>/dev/null || echo -e "${RED}No migrations table found${NC}"
}

# Parse command line arguments
case "$1" in
    "reset")
        echo -e "${RED}WARNING: This will delete ALL data in the database!${NC}"
        echo -n "Are you sure you want to reset the database? (yes/no): "
        read confirmation
        if [ "$confirmation" = "yes" ]; then
            reset_database
        else
            echo "Operation cancelled."
        fi
        ;;
    "rollback")
        if [ -z "$2" ]; then
            echo "Usage: $0 rollback <migration_file>"
            echo "Example: $0 rollback 012_insert_sample_data.sql"
            exit 1
        fi
        rollback_migration "$2"
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 {reset|rollback|status}"
        echo ""
        echo "Commands:"
        echo "  reset              - Drop all tables and reset database"
        echo "  rollback <file>    - Rollback specific migration"
        echo "  status             - Show migration status"
        echo ""
        echo "Examples:"
        echo "  $0 status"
        echo "  $0 rollback 012_insert_sample_data.sql"
        echo "  $0 reset"
        exit 1
        ;;
esac