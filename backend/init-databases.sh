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
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_auth_db" < /migrations/001_create_auth_table.sql

# Run user_db migrations
echo "Running user_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_user_db" < /migrations/021_create_user_table.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_user_db" < /migrations/022_create_users_reference.sql

# Run admin_db migrations (in auth_db)
echo "Running admin_db migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_auth_db" < /migrations/013_create_admin_table.sql

# Run other service database migrations
echo "Running service database migrations..."

# First create users reference table in each service database for FK references
echo "Creating users reference tables..."
for db in fitfood_meal_db fitfood_exercise_db fitfood_goal_db fitfood_reco_db fitfood_payment_db; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db" < /migrations/022_create_users_reference.sql 2>/dev/null || true
done

# Run minimal migrations for each service database (only what they need)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_meal_db" <<EOF
  CREATE TABLE IF NOT EXISTS meals (
      meal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      meal_type VARCHAR(20) NOT NULL,
      meal_date DATE NOT NULL,
      meal_time TIME,
      total_calories DECIMAL(8,2) DEFAULT 0,
      total_protein DECIMAL(6,2) DEFAULT 0,
      total_carbs DECIMAL(6,2) DEFAULT 0,
      total_fat DECIMAL(6,2) DEFAULT 0,
      total_fiber DECIMAL(6,2) DEFAULT 0,
      total_sugar DECIMAL(6,2) DEFAULT 0,
      meal_name VARCHAR(255),
      notes TEXT,
      is_completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
  CREATE INDEX IF NOT EXISTS idx_meals_meal_date ON meals(meal_date);
EOF

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fitfood_exercise_db" <<EOF
  CREATE TABLE IF NOT EXISTS exercises (
      exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      exercise_name VARCHAR(255) NOT NULL,
      exercise_date DATE NOT NULL,
      exercise_time TIME,
      duration_minutes INTEGER,
      calories_burned DECIMAL(8,2),
      intensity VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
  CREATE INDEX IF NOT EXISTS idx_exercises_exercise_date ON exercises(exercise_date);
EOF

echo "✓ Service database schema initialized"

echo "✓ All migrations completed"
