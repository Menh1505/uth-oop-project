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
if [ "$(probe http://$HOST:$PORT/api/admin/status)" = "200" ]; then
  BASE="http://$HOST:$PORT/api/admin"
elif [ "$(probe http://$HOST:$PORT/admin/status)" = "200" ]; then
  BASE="http://$HOST:$PORT/admin"
else
  echo "[!] NGINX not returning 200 at /api/admin/status or /admin/status on $HOST:$PORT."
  echo "    Check nginx.conf and ensure services are running (docker compose up)."
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

AUTH_BASE="http://$HOST:3011"
UA="curl-admin-test/1.0"

step() { echo; echo "=== $* ==="; }

# ============= ADMIN LOGIN =============
step "1) ADMIN LOGIN"
ADMIN_LOGIN=$(curl -s -X POST "$AUTH_BASE/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}')
echo "$ADMIN_LOGIN" | $JQ
ADMIN_ACCESS=$(echo "$ADMIN_LOGIN" | (jq -r '.access_token' 2>/dev/null || sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'))
echo "ADMIN_ACCESS(short) = ${ADMIN_ACCESS:0:30}..."

# ============= HEALTH CHECK =============
step "2) HEALTH CHECK"
curl -s http://$HOST:3013/health | $JQ

# ============= STATUS ENDPOINT =============
step "3) STATUS ENDPOINT (public)"
curl -s "$BASE/status" | $JQ

# ============= SYSTEM INFO =============
step "4) GET SYSTEM INFO (admin)"
curl -s "$BASE/system/info" \
  -H "Authorization: Bearer $ADMIN_ACCESS" | $JQ

# ============= SYSTEM HEALTH =============
step "5) GET SYSTEM HEALTH (admin)"
curl -s "$BASE/system/health" \
  -H "Authorization: Bearer $ADMIN_ACCESS" | $JQ

# ============= GET ALL USERS =============
step "6) GET ALL USERS (admin)"
curl -s "$BASE/users" \
  -H "Authorization: Bearer $ADMIN_ACCESS" | $JQ

# ============= GET ADMIN STATS =============
step "7) GET ADMIN STATS (admin)"
curl -s "$BASE/stats" \
  -H "Authorization: Bearer $ADMIN_ACCESS" | $JQ

# ============= TEST UNAUTHORIZED ACCESS =============
step "8) TEST UNAUTHORIZED - Admin endpoint without token (expect 401)"
curl -s -i "$BASE/users" | head -15

# ============= TEST INVALID TOKEN =============
step "9) TEST INVALID TOKEN (expect 401)"
curl -s -i "$BASE/system/info" \
  -H "Authorization: Bearer invalid_token" | head -15

# ============= DELETE USER (if any exists) =============
step "10) LIST USERS TO GET IDS"
USERS_JSON=$(curl -s "$BASE/users" \
  -H "Authorization: Bearer $ADMIN_ACCESS")
echo "$USERS_JSON" | $JQ
FIRST_USER=$(echo "$USERS_JSON" | (jq -r '.users[0].id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))

if [ -n "$FIRST_USER" ]; then
  step "11) DELETE USER $FIRST_USER"
  curl -s -i -X DELETE "$BASE/users/$FIRST_USER" \
    -H "Authorization: Bearer $ADMIN_ACCESS" | head -15
else
  echo "[i] No users found to delete"
fi

echo
echo "=== ADMIN SERVICE TESTS COMPLETE ==="

