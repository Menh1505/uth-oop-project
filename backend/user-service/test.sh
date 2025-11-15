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
if [ "$(probe http://$HOST:$PORT/api/users/status)" = "200" ]; then
  BASE="http://$HOST:$PORT/api/users"
elif [ "$(probe http://$HOST:$PORT/users/status)" = "200" ]; then
  BASE="http://$HOST:$PORT/users"
elif [ "$(probe http://$HOST:$PORT/status)" = "200" ]; then
  BASE="http://$HOST:$PORT"
else
  echo "[!] NGINX not returning 200 at /api/users/status, /users/status or /status on $HOST:$PORT."
  echo "    Check nginx.conf and ensure services are running (docker compose up)."
  echo "    Note: user-service is commented out in nginx.conf - enable it first!"
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

AUTH_BASE="http://$HOST:3011"
UA="curl-user-test/1.0"

step() { echo; echo "=== $* ==="; }

step "1) HEALTH CHECK (no auth needed since it's not behind gateway)"
curl -s http://$HOST:3012/health | $JQ

step "2) STATUS ENDPOINT (no auth required)"
curl -s "$BASE/status" | $JQ

step "3) TEST AUTH REQUIREMENT - GET /users/me without token (expect 401)"
curl -s -i "$BASE/users/me" | head -15

step "4) LOGIN to get auth token for testing"
LOGIN=$(curl -s -X POST "$AUTH_BASE/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}')
echo "$LOGIN" | $JQ
AUTH_TOKEN=$(echo "$LOGIN" | (jq -r '.access_token' 2>/dev/null || sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'))
echo "AUTH_TOKEN(short) = ${AUTH_TOKEN:0:30}..."

step "5) TEST INVALID TOKEN (expect 401)"
curl -s -i "$BASE/users/me" \
  -H "Authorization: Bearer invalid_token_xyz" | head -15

step "6) GET MY PROFILE (requires valid auth) - may return not found if profile not in DB"
curl -s "$BASE/users/me" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | $JQ

step "7) TEST UPDATE MY PROFILE with admin token"
curl -s -X PUT "$BASE/users/me" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Admin User",
    "avatar_url": "https://example.com/avatar.jpg",
    "phone": "+84901234567",
    "bio": "System administrator",
    "timezone": "Asia/Ho_Chi_Minh",
    "language": "vi"
  }' | $JQ

step "8) LIST ALL USERS (admin endpoint)"
curl -s "$BASE/admin/users?limit=10&offset=0" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | $JQ

step "9) TEST FORBIDDEN - GET admin/users with regular user"
LOGIN_REGULAR=$(curl -s -X POST "$AUTH_BASE/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"regular'$(date +%s)'@example.com","password":"Test@1234","username":"regular'$(date +%s)'"}')
echo "Registered regular user"

LOGIN_RESP=$(curl -s -X POST "$AUTH_BASE/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"regular'$(date +%s)'@example.com","password":"Test@1234"}')
REGULAR_TOKEN=$(echo "$LOGIN_RESP" | (jq -r '.access_token' 2>/dev/null || sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'))

curl -s -i "$BASE/admin/users" \
  -H "Authorization: Bearer $REGULAR_TOKEN" | head -15

echo
echo "=== USER SERVICE TESTS COMPLETE ==="
echo "NOTE: User profiles are created when a user registers via auth-service"
echo "      and are synced through RabbitMQ messages. Profiles in /api/users/admin/users"
echo "      may be empty if the RabbitMQ integration hasn't processed them yet."
