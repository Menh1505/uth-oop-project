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
