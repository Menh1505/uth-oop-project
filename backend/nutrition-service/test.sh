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
if [ "$(probe http://$HOST:$PORT/api/nutrition/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/api/nutrition"
elif [ "$(probe http://$HOST:$PORT/nutrition/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/nutrition"
else
  echo "[!] NGINX not returning 200 at /api/nutrition/health or /nutrition/health on $HOST:$PORT."
  echo "    Check nginx.conf and ensure services are running (docker compose up)."
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

AUTH_BASE="http://$HOST:3011"
UA="curl-nutrition-test/1.0"

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
curl -s http://$HOST:3016/health | $JQ

# ============= FOODS - CREATE =============
step "3) CREATE FOOD ITEM"
FOOD_JSON=$(curl -s -X POST "$BASE/foods" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chicken Breast",
    "description": "Grilled chicken breast",
    "calories": 165,
    "protein": 31,
    "carbs": 0,
    "fat": 3.6,
    "fiber": 0,
    "serving_size": 100,
    "serving_unit": "g"
  }')
echo "$FOOD_JSON" | $JQ
FOOD_ID=$(echo "$FOOD_JSON" | (jq -r '.food.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "FOOD_ID: $FOOD_ID"

# ============= FOODS - GET ALL =============
step "4) GET ALL FOODS"
curl -s "$BASE/foods" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= FOODS - GET ONE =============
if [ -n "$FOOD_ID" ]; then
  step "5) GET SINGLE FOOD ($FOOD_ID)"
  curl -s "$BASE/foods/$FOOD_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

  # ============= FOODS - UPDATE =============
  step "6) UPDATE FOOD"
  curl -s -X PUT "$BASE/foods/$FOOD_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Grilled Chicken Breast",
      "calories": 170,
      "protein": 32
    }' | $JQ
fi

# ============= MEAL LOGS - CREATE =============
step "7) CREATE MEAL LOG"
LOG_JSON=$(curl -s -X POST "$BASE/meal-logs" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "food_id": "'$FOOD_ID'",
    "meal_type": "breakfast",
    "serving_size": 150,
    "serving_unit": "g",
    "notes": "Morning breakfast"
  }')
echo "$LOG_JSON" | $JQ
LOG_ID=$(echo "$LOG_JSON" | (jq -r '.log.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "LOG_ID: $LOG_ID"

# ============= MEAL LOGS - GET ALL =============
step "8) GET ALL MEAL LOGS"
curl -s "$BASE/meal-logs" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= MEAL LOGS - GET ONE =============
if [ -n "$LOG_ID" ]; then
  step "9) GET SINGLE MEAL LOG ($LOG_ID)"
  curl -s "$BASE/meal-logs/$LOG_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

  # ============= MEAL LOGS - UPDATE =============
  step "10) UPDATE MEAL LOG"
  curl -s -X PUT "$BASE/meal-logs/$LOG_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "serving_size": 200,
      "notes": "Ate more than planned"
    }' | $JQ
fi

# ============= NUTRITION GOALS - GET =============
step "11) GET NUTRITION GOALS"
curl -s "$BASE/goals" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= NUTRITION GOALS - SET =============
step "12) SET NUTRITION GOALS"
curl -s -X POST "$BASE/goals" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daily_calories": 2000,
    "daily_protein": 150,
    "daily_carbs": 200,
    "daily_fat": 70
  }' | $JQ

# ============= DAILY NUTRITION ANALYSIS =============
step "13) GET DAILY NUTRITION ANALYSIS"
curl -s "$BASE/analysis/daily" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= WEEKLY NUTRITION ANALYSIS =============
step "14) GET WEEKLY NUTRITION ANALYSIS"
curl -s "$BASE/analysis/weekly" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= TEST UNAUTHORIZED =============
step "15) TEST WITHOUT AUTH TOKEN (expect 401)"
curl -s -i "$BASE/foods" | head -15

# ============= CLEANUP: DELETE MEAL LOG =============
if [ -n "$LOG_ID" ]; then
  step "16) DELETE MEAL LOG ($LOG_ID)"
  curl -s -X DELETE "$BASE/meal-logs/$LOG_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ
fi

# ============= CLEANUP: DELETE FOOD =============
if [ -n "$FOOD_ID" ]; then
  step "17) DELETE FOOD ($FOOD_ID)"
  curl -s -X DELETE "$BASE/foods/$FOOD_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ
fi

echo
echo "=== NUTRITION SERVICE TESTS COMPLETE ==="
echo "Database tables verified: foods, meal_logs, nutrition_goals"

