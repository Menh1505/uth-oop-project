#!/bin/bash

# Database Migration Runner Script
# This script runs all migration files in order

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

# Migration directory
MIGRATION_DIR="$(dirname "$0")/migrations"

echo -e "${YELLOW}Starting FitFood Database Migrations...${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Migration Directory: $MIGRATION_DIR"
echo ""

# Check if migration directory exists
if [ ! -d "$MIGRATION_DIR" ]; then
    echo -e "${RED}Error: Migration directory not found: $MIGRATION_DIR${NC}"
    exit 1
fi

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL client (psql) is not installed${NC}"
    exit 1
fi

# Create database if it doesn't exist
echo -e "${YELLOW}Creating database if it doesn't exist...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;" postgres 2>/dev/null || true

# Create migrations tracking table
echo -e "${YELLOW}Creating migration tracking table...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_file VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to create migration tracking table${NC}"
    exit 1
fi

# Run migrations in order
echo -e "${YELLOW}Running migrations...${NC}"
success_count=0
error_count=0

for migration_file in $(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort); do
    filename=$(basename "$migration_file")
    
    # Check if migration has already been run
    already_run=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_file = '$filename';" | tr -d ' ')
    
    if [ "$already_run" -eq 1 ]; then
        echo -e "${YELLOW}Skipping $filename (already executed)${NC}"
        continue
    fi
    
    echo -e "Running migration: ${GREEN}$filename${NC}"
    
    # Run the migration
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration_file"; then
        # Record successful migration
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "INSERT INTO schema_migrations (migration_file) VALUES ('$filename');" > /dev/null
        echo -e "${GREEN}✓ Successfully executed $filename${NC}"
        ((success_count++))
    else
        echo -e "${RED}✗ Failed to execute $filename${NC}"
        ((error_count++))
    fi
    echo ""
done

# Summary
echo -e "${YELLOW}Migration Summary:${NC}"
echo -e "${GREEN}Successful migrations: $success_count${NC}"
if [ $error_count -gt 0 ]; then
    echo -e "${RED}Failed migrations: $error_count${NC}"
    exit 1
else
    echo -e "${GREEN}All migrations completed successfully!${NC}"
fi

echo ""
echo -e "${YELLOW}Database schema is now ready for the FitFood application.${NC}"