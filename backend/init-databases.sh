#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE DATABASE fitfood_auth_db;
  CREATE DATABASE fitfood_user_db;
  CREATE DATABASE fitfood_meal_db;
  CREATE DATABASE fitfood_exercise_db;
  CREATE DATABASE fitfood_goal_db;
  CREATE DATABASE fitfood_reco_db;
  CREATE DATABASE fitfood_payment_db;
EOSQL

echo "✓ All databases created"

# Run auth_db migrations
echo "Running auth_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_auth_db" < /migrations/auth_db.sql

# Run user_db migrations
echo "Running user_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_user_db" < /migrations/user_db.sql

# Run admin_db migrations
echo "Running admin_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_auth_db" < /migrations/admin_db.sql

echo "✓ All migrations completed"
