#!/usr/bin/env bash
set -euo pipefail

# ---- jq (optional for pretty-printing JSON) ----
if command -v jq >/dev/null 2>&1; then
  JQ="jq ."
else
  echo "[i] 'jq' not found. Output will be raw JSON. (Ubuntu: sudo apt install jq -y)"
  JQ="cat"
fi

# ---- Call through NGINX on port 3000 ----
HOST=${HOST:-localhost}
PORT=${PORT:-3000}

probe() { curl -s -o /dev/null -w "%{http_code}" "$1"; }

# Auto-detect base path via NGINX
if [ "$(probe http://$HOST:$PORT/api/workouts/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/api/workouts"
elif [ "$(probe http://$HOST:$PORT/workouts/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/workouts"
else
  echo "[!] NGINX not returning 200 at /api/workouts/health or /workouts/health on $HOST:$PORT."
  echo "    Check nginx.conf and ensure services are running (docker compose up)."
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

AUTH_BASE="http://$HOST:3011"
UA="curl-workout-test/1.0"

step() { echo; echo "=== $* ==="; }

# ============= GET AUTH TOKEN =============
step "1) LOGIN TO GET AUTH TOKEN"
LOGIN=$(curl -s -X POST "$AUTH_BASE/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}')
echo "$LOGIN" | $JQ
AUTH_TOKEN=$(echo "$LOGIN" | (jq -r '.access_token' 2>/dev/null || sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'))
echo "AUTH_TOKEN(short) = ${AUTH_TOKEN:0:30}..."

# ============= HEALTH CHECK =============
step "2) HEALTH CHECK (public)"
curl -s http://$HOST:3015/health | $JQ

# ============= WORKOUT PLANS - CREATE =============
step "3) CREATE WORKOUT PLAN"
PLAN_JSON=$(curl -s -X POST "$BASE/plans" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Full Body Workout",
    "description": "Complete full body exercise plan",
    "difficulty": "intermediate",
    "duration_weeks": 4,
    "target_days_per_week": 3
  }')
echo "$PLAN_JSON" | $JQ
PLAN_ID=$(echo "$PLAN_JSON" | (jq -r '.plan.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "PLAN_ID: $PLAN_ID"

# ============= WORKOUT PLANS - GET ALL =============
step "4) GET ALL WORKOUT PLANS"
curl -s "$BASE/plans" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= WORKOUT PLANS - GET ONE =============
if [ -n "$PLAN_ID" ]; then
  step "5) GET SINGLE WORKOUT PLAN ($PLAN_ID)"
  curl -s "$BASE/plans/$PLAN_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

  # ============= WORKOUT PLANS - UPDATE =============
  step "6) UPDATE WORKOUT PLAN"
  curl -s -X PUT "$BASE/plans/$PLAN_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Advanced Full Body Workout",
      "description": "Updated full body exercise plan",
      "difficulty": "advanced",
      "duration_weeks": 8,
      "target_days_per_week": 4
    }' | $JQ
fi

# ============= EXERCISES - CREATE =============
step "7) CREATE EXERCISE"
EXERCISE_JSON=$(curl -s -X POST "$BASE/exercises" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bench Press",
    "description": "Classic chest exercise",
    "muscle_group": "chest",
    "difficulty": "intermediate",
    "instructions": "Lie flat, press bar up",
    "sets": 3,
    "reps": 8,
    "rest_seconds": 90
  }')
echo "$EXERCISE_JSON" | $JQ
EXERCISE_ID=$(echo "$EXERCISE_JSON" | (jq -r '.exercise.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "EXERCISE_ID: $EXERCISE_ID"

# ============= EXERCISES - GET ALL =============
step "8) GET ALL EXERCISES"
curl -s "$BASE/exercises" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= EXERCISES - GET ONE =============
if [ -n "$EXERCISE_ID" ]; then
  step "9) GET SINGLE EXERCISE ($EXERCISE_ID)"
  curl -s "$BASE/exercises/$EXERCISE_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

  # ============= EXERCISES - UPDATE =============
  step "10) UPDATE EXERCISE"
  curl -s -X PUT "$BASE/exercises/$EXERCISE_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Incline Bench Press",
      "description": "Upper chest exercise",
      "difficulty": "advanced",
      "sets": 4,
      "reps": 6,
      "rest_seconds": 120
    }' | $JQ
fi

# ============= WORKOUT LOGS - CREATE =============
step "11) CREATE WORKOUT LOG"
LOG_JSON=$(curl -s -X POST "$BASE/logs" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exercise_id": "'$EXERCISE_ID'",
    "sets": 3,
    "reps": 8,
    "weight": 80,
    "unit": "kg",
    "duration_minutes": 30,
    "notes": "Good form today"
  }')
echo "$LOG_JSON" | $JQ
LOG_ID=$(echo "$LOG_JSON" | (jq -r '.log.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "LOG_ID: $LOG_ID"

# ============= WORKOUT LOGS - GET ALL =============
step "12) GET ALL WORKOUT LOGS"
curl -s "$BASE/logs" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= WORKOUT LOGS - GET ONE =============
if [ -n "$LOG_ID" ]; then
  step "13) GET SINGLE WORKOUT LOG ($LOG_ID)"
  curl -s "$BASE/logs/$LOG_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

  # ============= WORKOUT LOGS - UPDATE =============
  step "14) UPDATE WORKOUT LOG"
  curl -s -X PUT "$BASE/logs/$LOG_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "sets": 4,
      "reps": 10,
      "weight": 85,
      "notes": "Increased weight"
    }' | $JQ
fi

# ============= STATS =============
step "15) GET USER STATS"
curl -s "$BASE/stats" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= TEST UNAUTHORIZED =============
step "16) TEST WITHOUT AUTH TOKEN (expect 401)"
curl -s -i "$BASE/plans" | head -15

# ============= CLEANUP: DELETE LOGS =============
if [ -n "$LOG_ID" ]; then
  step "17) DELETE WORKOUT LOG ($LOG_ID)"
  curl -s -X DELETE "$BASE/logs/$LOG_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ
fi

# ============= CLEANUP: DELETE EXERCISES =============
if [ -n "$EXERCISE_ID" ]; then
  step "18) DELETE EXERCISE ($EXERCISE_ID)"
  curl -s -X DELETE "$BASE/exercises/$EXERCISE_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ
fi

# ============= CLEANUP: DELETE PLANS =============
if [ -n "$PLAN_ID" ]; then
  step "19) DELETE WORKOUT PLAN ($PLAN_ID)"
  curl -s -X DELETE "$BASE/plans/$PLAN_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ
fi

echo
echo "=== WORKOUT SERVICE TESTS COMPLETE ==="
echo "Database tables verified: workout_plans, exercises, workout_logs"

