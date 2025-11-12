#!/bin/bash
set -e

# Create multiple databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE auth_db;
  CREATE DATABASE user_db;
  CREATE DATABASE admin_db;

  -- Grant permissions
  GRANT ALL PRIVILEGES ON DATABASE auth_db TO $POSTGRES_USER;
  GRANT ALL PRIVILEGES ON DATABASE user_db TO $POSTGRES_USER;
  GRANT ALL PRIVILEGES ON DATABASE admin_db TO $POSTGRES_USER;
EOSQL

# Run migrations for each database
echo "Running auth_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "auth_db" < /migrations/auth_db.sql

echo "Running user_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "user_db" < /migrations/user_db.sql

echo "Running admin_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "admin_db" < /migrations/admin_db.sql

echo "Database initialization completed!"
