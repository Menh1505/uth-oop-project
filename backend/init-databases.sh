#!/bin/bash
set -e

# FitFood Database Initialization Script
# This script is executed when PostgreSQL container starts for the first time

echo "🚀 Initializing FitFood databases..."

# Create databases for different services
echo "Creating databases..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create auth service database
    CREATE DATABASE auth_db;
    
    -- Create user service database  
    CREATE DATABASE user_db;
    
    -- Create main fitfood database
    CREATE DATABASE fitfood_db;
    
    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE user_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE fitfood_db TO $POSTGRES_USER;
EOSQL

echo "✅ Databases created successfully!"

# Run migrations if migration files exist
if [ -d "/migrations" ] && [ "$(ls -A /migrations/*.sql 2>/dev/null)" ]; then
    echo "🔄 Running migrations..."
    
    # Function to run migrations for a specific database
    run_migrations_for_db() {
        local db_name=$1
        local migration_pattern=$2
        
        echo "Running migrations for $db_name..."
        
        # Create migration tracking table
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db_name" <<-EOSQL
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                migration_file VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
EOSQL
        
        # Run migration files in order
        for migration_file in $(ls /migrations/$migration_pattern 2>/dev/null | sort); do
            filename=$(basename "$migration_file")
            
            # Check if migration has already been run
            already_run=$(psql -t --username "$POSTGRES_USER" --dbname "$db_name" -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_file = '$filename';" | tr -d ' ')
            
            if [ "$already_run" -eq 0 ]; then
                echo "Executing $filename on $db_name..."
                if psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db_name" -f "$migration_file"; then
                    # Record successful migration
                    psql --username "$POSTGRES_USER" --dbname "$db_name" -c "INSERT INTO schema_migrations (migration_file) VALUES ('$filename');"
                    echo "✅ Successfully executed $filename"
                else
                    echo "❌ Failed to execute $filename"
                    exit 1
                fi
            else
                echo "⏭️ Skipping $filename (already executed)"
            fi
        done
    }
    
    # Run FitFood main database migrations (all numbered migration files)
    if [ "$(ls /migrations/0*.sql 2>/dev/null)" ]; then
        run_migrations_for_db "fitfood_db" "0*.sql"
    fi
    
    # Note: Service-specific migrations would be handled by the services themselves
    # when they start up, not here in the database initialization
    
    echo "✅ All migrations completed successfully!"
else
    echo "⚠️ No migration files found in /migrations directory"
fi

echo "🎉 FitFood database initialization completed!"
echo ""
echo "Created databases:"
echo "  - auth_db (for authentication service)"  
echo "  - user_db (for user service)"
echo "  - fitfood_db (main application database)"
echo ""
echo "You can connect to the databases using:"
echo "  psql -h localhost -p 5432 -U $POSTGRES_USER -d fitfood_db"