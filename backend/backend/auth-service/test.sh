#!/usr/bin/env bash
set -euo pipefail

# ---- jq (tùy chọn, để in JSON đẹp) ----
if command -v jq >/dev/null 2>&1; then
  JQ="jq ."
else
  echo "[i] 'jq' not found. Output will be raw JSON. (Ubuntu: sudo apt install jq -y)"
  JQ="cat"
fi

# ---- Gọi qua NGINX ở cổng 3000 ----
HOST=${HOST:-localhost}
PORT=${PORT:-3000}

probe() { curl -s -o /dev/null -w "%{http_code}" "$1"; }

# Tự phát hiện base path trên NGINX
if [ "$(probe http://$HOST:$PORT/api/auth/status)" = "200" ]; then
  BASE="http://$HOST:$PORT/api/auth"
elif [ "$(probe http://$HOST:$PORT/auth/status)" = "200" ]; then
  BASE="http://$HOST:$PORT/auth"
elif [ "$(probe http://$HOST:$PORT/status)" = "200" ]; then
  BASE="http://$HOST:$PORT"
else
  echo "[!] NGINX không trả 200 ở /api/auth/status, /auth/status hay /status trên $HOST:$PORT."
  echo "    Kiểm tra nginx.conf và service đã chạy chưa (docker compose up)."
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

JAR="/tmp/auth-cookie.jar"
UA="curl-nginx-3000/1.0"
rm -f "$JAR"

step() { echo; echo "=== $* ==="; }

step "1) HEALTH"
curl -s "$BASE/health" | $JQ

step "2) REGISTER"
curl -s -X POST "$BASE/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"u1@example.com","password":"123456","username":"u1"}' | $JQ

step "3) LOGIN (set-cookie refresh_token)"
LOGIN_JSON=$(curl -s -c "$JAR" -A "$UA" -X POST "$BASE/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"u1@example.com","password":"123456"}')
echo "$LOGIN_JSON" | $JQ
# Trích access/refresh từ JSON (jq nếu có, fallback sed nếu không)
ACCESS=$(echo "$LOGIN_JSON" | (jq -r '.access_token' 2>/dev/null || sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'))
REFRESH=$(echo "$LOGIN_JSON" | (jq -r '.refresh_token' 2>/dev/null || sed -n 's/.*"refresh_token":"\([^"]*\)".*/\1/p'))
echo "ACCESS(short) = ${ACCESS:0:30}..."
echo "REFRESH(short)= ${REFRESH:0:12}..."

step "4) VERIFY access_token"
curl -s "$BASE/verify" -H "Authorization: Bearer $ACCESS" | $JQ

step "5) LIST SESSIONS (cookie)"
curl -s -b "$JAR" -X GET "$BASE/sessions" -H "Content-Type: application/json" | $JQ

step "6) REFRESH (A: cookie)"
REFRESH_JSON_COOKIE=$(curl -s -b "$JAR" -c "$JAR" -A "$UA" -X POST "$BASE/refresh" \
  -H "Content-Type: application/json" -d '{}')
echo "$REFRESH_JSON_COOKIE" | $JQ
ACCESS2=$(echo "$REFRESH_JSON_COOKIE" | (jq -r '.access_token' 2>/dev/null || sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'))
REFRESH2=$(echo "$REFRESH_JSON_COOKIE" | (jq -r '.refresh_token' 2>/dev/null || sed -n 's/.*"refresh_token":"\([^"]*\)".*/\1/p'))

step "6b) REFRESH (B: body)"
REFRESH_JSON_BODY=$(curl -s -X POST "$BASE/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH2\"}")
echo "$REFRESH_JSON_BODY" | $JQ
ACCESS3=$(echo "$REFRESH_JSON_BODY" | (jq -r '.access_token' 2>/dev/null || sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'))
REFRESH3=$(echo "$REFRESH_JSON_BODY" | (jq -r '.refresh_token' 2>/dev/null || sed -n 's/.*"refresh_token":"\([^"]*\)".*/\1/p'))

step "7) VERIFY access_token mới"
curl -s "$BASE/verify" -H "Authorization: Bearer $ACCESS3" | $JQ

step "8) LIST SESSIONS (kèm body refresh để đánh dấu current)"
curl -s -b "$JAR" -X GET "$BASE/sessions" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH3\"}" | $JQ

step "9) LOGOUT (blacklist access + xoá session khớp refresh)"
curl -s -X POST "$BASE/logout" \
  -H "Authorization: Bearer $ACCESS3" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH3\"}" | $JQ

step "10) VERIFY lại ACCESS3 (kỳ vọng 401)"
curl -s -i "$BASE/verify" -H "Authorization: Bearer $ACCESS3" | sed -n '1,20p'

step "11) ADMIN LOGIN (seed admin/password)"
ADMIN_LOGIN=$(curl -s -c "$JAR" -A "$UA" -X POST "$BASE/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}')
echo "$ADMIN_LOGIN" | $JQ
ADMIN_ACCESS=$(echo "$ADMIN_LOGIN" | (jq -r '.access_token' 2>/dev/null || sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'))

step "12) ADMIN: LIST BLACKLIST"
curl -s "$BASE/blacklist" -H "Authorization: Bearer $ADMIN_ACCESS" | $JQ

step "13) ADMIN: BLACKLIST thủ công 1 access token (ACCESS ban đầu)"
curl -s -X POST "$BASE/blacklist" \
  -H "Authorization: Bearer $ADMIN_ACCESS" \
  -H "Content-Type: application/json" \
  -d "{\"access_token\":\"$ACCESS\"}" | $JQ

step "14) LIST SESSIONS lần nữa"
curl -s "$BASE/sessions" | $JQ

step "15) DELETE 1 SESSION theo id (lấy id đầu)"
FIRST_ID=$(curl -s "$BASE/sessions" | (jq -r '.items[0].id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
if [ -n "$FIRST_ID" ]; then
  curl -s -X DELETE "$BASE/sessions/$FIRST_ID" | cat ; echo
fi

step "16) DELETE ALL SESSIONS (nguy hiểm)"
curl -s -X DELETE "$BASE/sessions?all=1" | cat ; echo

echo
echo "=== DONE ==="
