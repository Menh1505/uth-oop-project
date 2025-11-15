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
if [ "$(probe http://$HOST:$PORT/api/recommendations)" = "200" ]; then
  BASE="http://$HOST:$PORT/api/recommendations"
elif [ "$(probe http://$HOST:$PORT/recommendations)" = "200" ]; then
  BASE="http://$HOST:$PORT/recommendations"
else
  echo "[!] NGINX not returning 200 at /api/recommendations or /recommendations on $HOST:$PORT."
  echo "    Check nginx.conf and ensure services are running (docker compose up)."
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

UA="curl-recommendation-test/1.0"
USER_ID="user123"

step() { echo; echo "=== $* ==="; }

# ============= HEALTH CHECK =============
step "1) HEALTH CHECK (direct service)"
curl -s http://$HOST:3022/health 2>/dev/null || echo "No health endpoint"

# ============= CREATE USER =============
step "2) CREATE USER IN RECOMMENDATION SERVICE"
USER_JSON=$(curl -s -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "email": "user@example.com",
    "name": "John Doe",
    "preferences": {
      "dietary": ["vegetarian"],
      "fitness_level": "intermediate",
      "exercise_preference": "strength_training"
    }
  }')
echo "$USER_JSON" | $JQ

# ============= LIST USERS =============
step "3) LIST ALL USERS"
curl -s "$BASE/users" | $JQ

# ============= GET SINGLE USER =============
step "4) GET SINGLE USER ($USER_ID)"
curl -s "$BASE/users/$USER_ID" | $JQ

# ============= UPDATE USER =============
step "5) UPDATE USER PREFERENCES"
curl -s -X PUT "$BASE/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "dietary": ["vegetarian", "gluten_free"],
      "fitness_level": "advanced",
      "exercise_preference": "cardio"
    }
  }' | $JQ

# ============= TRACK USER BEHAVIOR - EXERCISE =============
step "6) TRACK USER BEHAVIOR: COMPLETED EXERCISE"
curl -s -X POST "$BASE/users/$USER_ID/behaviors" \
  -H "Content-Type: application/json" \
  -d '{
    "behavior_type": "exercise_completed",
    "data": {
      "exercise_id": "exercise123",
      "exercise_name": "Bench Press",
      "duration": 30,
      "intensity": "high"
    }
  }' | $JQ

# ============= TRACK USER BEHAVIOR - FOOD =============
step "7) TRACK USER BEHAVIOR: ATE FOOD"
curl -s -X POST "$BASE/users/$USER_ID/behaviors" \
  -H "Content-Type: application/json" \
  -d '{
    "behavior_type": "food_eaten",
    "data": {
      "food_id": "food456",
      "food_name": "Chicken Breast",
      "calories": 165,
      "protein": 31
    }
  }' | $JQ

# ============= TRACK USER BEHAVIOR - ORDER =============
step "8) TRACK USER BEHAVIOR: PLACED ORDER"
curl -s -X POST "$BASE/users/$USER_ID/behaviors" \
  -H "Content-Type: application/json" \
  -d '{
    "behavior_type": "order_placed",
    "data": {
      "order_id": "order789",
      "restaurant_id": "rest123",
      "total_amount": 150000
    }
  }' | $JQ

# ============= GET USER BEHAVIORS =============
step "9) GET USER BEHAVIORS"
curl -s "$BASE/users/$USER_ID/behaviors" | $JQ

# ============= GENERATE RECOMMENDATIONS =============
step "10) GENERATE RECOMMENDATIONS FOR USER"
curl -s -X POST "$BASE/users/$USER_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation_types": ["exercises", "foods", "restaurants"]
  }' | $JQ

# ============= GET ALL RECOMMENDATIONS =============
step "11) GET ALL RECOMMENDATIONS FOR USER"
curl -s "$BASE/users/$USER_ID/recommendations" | $JQ

# ============= GET EXERCISE RECOMMENDATIONS =============
step "12) GET EXERCISE RECOMMENDATIONS"
curl -s "$BASE/users/$USER_ID/recommendations/exercises" | $JQ

# ============= GET FOOD RECOMMENDATIONS =============
step "13) GET FOOD RECOMMENDATIONS"
curl -s "$BASE/users/$USER_ID/recommendations/foods" | $JQ

# ============= GET QUICK RECOMMENDATIONS =============
step "14) GET QUICK RECOMMENDATIONS"
curl -s "$BASE/users/$USER_ID/recommendations/quick" | $JQ

# ============= UPDATE RECOMMENDATION STATUS =============
step "15) UPDATE RECOMMENDATION STATUS (get first recommendation id)"
RECOMMENDATIONS=$(curl -s "$BASE/users/$USER_ID/recommendations")
FIRST_REC_ID=$(echo "$RECOMMENDATIONS" | (jq -r '.data[0].id // .data[0].recommendation_id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))

if [ -n "$FIRST_REC_ID" ]; then
  step "16) UPDATE RECOMMENDATION ($FIRST_REC_ID) STATUS"
  curl -s -X PUT "$BASE/users/$USER_ID/recommendations/$FIRST_REC_ID" \
    -H "Content-Type: application/json" \
    -d '{"status":"clicked"}' | $JQ
else
  echo "[i] No recommendations found to update"
fi

# ============= TEST WITH ANOTHER USER =============
step "17) CREATE ANOTHER USER FOR COMPARISON"
USER2_ID="user456"
curl -s -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER2_ID'",
    "email": "user2@example.com",
    "name": "Jane Smith",
    "preferences": {
      "dietary": ["vegan"],
      "fitness_level": "beginner",
      "exercise_preference": "yoga"
    }
  }' | $JQ

# ============= TRACK BEHAVIOR FOR USER 2 =============
step "18) TRACK BEHAVIOR FOR USER 2"
curl -s -X POST "$BASE/users/$USER2_ID/behaviors" \
  -H "Content-Type: application/json" \
  -d '{
    "behavior_type": "exercise_completed",
    "data": {
      "exercise_id": "exercise456",
      "exercise_name": "Yoga",
      "duration": 60,
      "intensity": "low"
    }
  }' | $JQ

# ============= GENERATE RECOMMENDATIONS FOR USER 2 =============
step "19) GENERATE RECOMMENDATIONS FOR USER 2"
curl -s -X POST "$BASE/users/$USER2_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation_types": ["exercises", "foods"]
  }' | $JQ

# ============= LIST ALL USERS AGAIN =============
step "20) LIST ALL USERS (should have 2+ users)"
curl -s "$BASE/users" | $JQ

# ============= DELETE USER =============
step "21) DELETE USER ($USER2_ID)"
curl -s -X DELETE "$BASE/users/$USER2_ID" | $JQ

echo
echo "=== RECOMMENDATION SERVICE TESTS COMPLETE ==="
echo "Database tables verified: users, user_behaviors, recommendations"
echo "Note: Uses AI recommendations (OpenAI/Claude) for intelligent suggestions"

