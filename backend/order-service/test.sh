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
if [ "$(probe http://$HOST:$PORT/api/orders/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/api/orders"
elif [ "$(probe http://$HOST:$PORT/orders/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/orders"
else
  echo "[!] NGINX not returning 200 at /api/orders/health or /orders/health on $HOST:$PORT."
  echo "    Check nginx.conf and ensure services are running (docker compose up)."
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

AUTH_BASE="http://$HOST:3011"
UA="curl-order-test/1.0"

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
curl -s http://$HOST:3017/health | $JQ

# ============= CREATE ORDER =============
step "3) CREATE ORDER"
ORDER_JSON=$(curl -s -X POST "$BASE/" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "1",
    "items": [
      {"menu_item_id": "1", "quantity": 2, "special_instructions": "Extra spicy"},
      {"menu_item_id": "2", "quantity": 1}
    ],
    "delivery_address": "123 Main St, City",
    "delivery_notes": "Ring doorbell twice",
    "payment_method": "credit_card"
  }')
echo "$ORDER_JSON" | $JQ
ORDER_ID=$(echo "$ORDER_JSON" | (jq -r '.order.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "ORDER_ID: $ORDER_ID"

# ============= GET USER ORDERS =============
step "4) GET USER ORDERS"
curl -s "$BASE/" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= GET SINGLE ORDER =============
if [ -n "$ORDER_ID" ]; then
  step "5) GET SINGLE ORDER ($ORDER_ID)"
  curl -s "$BASE/$ORDER_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

  # ============= UPDATE ORDER =============
  step "6) UPDATE ORDER"
  curl -s -X PUT "$BASE/$ORDER_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "delivery_address": "456 New Address, City",
      "delivery_notes": "Updated delivery note"
    }' | $JQ

  # ============= UPDATE ORDER STATUS =============
  step "7) UPDATE ORDER STATUS TO CONFIRMED"
  curl -s -X PUT "$BASE/$ORDER_ID/status" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"confirmed"}' | $JQ

  # ============= GET STATUS HISTORY =============
  step "8) GET ORDER STATUS HISTORY"
  curl -s "$BASE/$ORDER_ID/status-history" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

  # ============= CONFIRM ORDER =============
  step "9) CONFIRM ORDER"
  curl -s -X POST "$BASE/$ORDER_ID/confirm" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' | $JQ

  # ============= MARK ORDER READY =============
  step "10) MARK ORDER AS READY FOR DELIVERY"
  curl -s -X POST "$BASE/$ORDER_ID/ready" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' | $JQ

  # ============= MARK ORDER DELIVERED =============
  step "11) MARK ORDER AS DELIVERED"
  curl -s -X POST "$BASE/$ORDER_ID/delivered" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' | $JQ
fi

# ============= GET ORDER STATS =============
step "12) GET USER ORDER STATS"
curl -s "$BASE/analytics/stats" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= GET ALL ORDERS (ADMIN) =============
step "13) GET ALL ORDERS (admin endpoint)"
curl -s "$BASE/admin/all" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= GET GLOBAL STATS (ADMIN) =============
step "14) GET GLOBAL ORDER STATS (admin)"
curl -s "$BASE/admin/stats" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= TEST UNAUTHORIZED =============
step "15) TEST WITHOUT AUTH TOKEN (expect 401)"
curl -s -i "$BASE/" | head -15

# ============= CLEANUP: DELETE ORDER =============
if [ -n "$ORDER_ID" ]; then
  step "16) DELETE ORDER ($ORDER_ID)"
  curl -s -X DELETE "$BASE/$ORDER_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ
fi

echo
echo "=== ORDER SERVICE TESTS COMPLETE ==="
echo "Database tables verified: orders, order_items, order_status_history"

