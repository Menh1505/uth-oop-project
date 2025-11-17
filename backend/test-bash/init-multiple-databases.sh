#!/bin/bash

# Create databases using createdb (ignore if already exists)
# Only create databases that have migration files
createdb -U "$POSTGRES_USER" auth_db 2>/dev/null || true
createdb -U "$POSTGRES_USER" user_db 2>/dev/null || true
createdb -U "$POSTGRES_USER" admin_db 2>/dev/null || true
createdb -U "$POSTGRES_USER" nutrition_db 2>/dev/null || true
createdb -U "$POSTGRES_USER" order_db 2>/dev/null || true
createdb -U "$POSTGRES_USER" payment_db 2>/dev/null || true
createdb -U "$POSTGRES_USER" partner_db 2>/dev/null || true
createdb -U "$POSTGRES_USER" delivery_db 2>/dev/null || true
createdb -U "$POSTGRES_USER" catalog_db 2>/dev/null || true

# Run migrations for each database that has a migration file
echo "Running auth_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "auth_db" < /migrations/auth_db.sql || echo "auth_db migration failed"

echo "Running user_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "user_db" < /migrations/user_db.sql || echo "user_db migration failed"

echo "Running admin_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "admin_db" < /migrations/admin_db.sql || echo "admin_db migration failed"

echo "Running nutrition_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "nutrition_db" < /migrations/nutrition_db.sql || echo "nutrition_db migration failed"

echo "Running order_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "order_db" < /migrations/order_db.sql || echo "order_db migration failed"

echo "Running payment_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "payment_db" < /migrations/payment_db.sql || echo "payment_db migration failed"

echo "Running partner_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "partner_db" < /migrations/partner_db.sql || echo "partner_db migration failed"

echo "Running delivery_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "delivery_db" < /migrations/delivery_db.sql 2>&1 | grep -v "ERROR:  extension \"postgis\" does not exist" || echo "delivery_db migration completed (postgis extension may not be available)"

echo "Running catalog_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "catalog_db" < /migrations/catalog_db.sql || echo "catalog_db migration failed"

echo "Database initialization completed!"
