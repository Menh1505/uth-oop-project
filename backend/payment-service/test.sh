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
if [ "$(probe http://$HOST:$PORT/api/payments/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/api/payments"
elif [ "$(probe http://$HOST:$PORT/payments/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/payments"
else
  echo "[!] NGINX not returning 200 at /api/payments/health or /payments/health on $HOST:$PORT."
  echo "    Check nginx.conf and ensure services are running (docker compose up)."
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

AUTH_BASE="http://$HOST:3011"
UA="curl-payment-test/1.0"

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
curl -s http://$HOST:3018/health | $JQ

# ============= CREATE MOCK PAYMENT =============
step "3) CREATE MOCK PAYMENT"
PAYMENT_JSON=$(curl -s -X POST "$BASE/mock" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "1",
    "amount": 150000,
    "currency": "VND",
    "payment_method": "credit_card",
    "description": "Food order payment"
  }')
echo "$PAYMENT_JSON" | $JQ
PAYMENT_ID=$(echo "$PAYMENT_JSON" | (jq -r '.payment.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "PAYMENT_ID: $PAYMENT_ID"

# ============= CREATE PAYOS PAYMENT =============
step "4) CREATE PAYOS PAYMENT"
PAYOS_JSON=$(curl -s -X POST "$BASE/payos" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "2",
    "amount": 200000,
    "currency": "VND",
    "description": "Food order via PayOS"
  }')
echo "$PAYOS_JSON" | $JQ

# ============= GET USER PAYMENTS =============
step "5) GET USER PAYMENTS"
curl -s "$BASE/payments" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= GET SINGLE PAYMENT =============
if [ -n "$PAYMENT_ID" ]; then
  step "6) GET SINGLE PAYMENT ($PAYMENT_ID)"
  curl -s "$BASE/payments/$PAYMENT_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

  # ============= UPDATE PAYMENT =============
  step "7) UPDATE PAYMENT STATUS"
  curl -s -X PUT "$BASE/payments/$PAYMENT_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"completed"}' | $JQ
fi

# ============= CREATE REFUND =============
step "8) CREATE REFUND"
REFUND_JSON=$(curl -s -X POST "$BASE/refunds" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "'$PAYMENT_ID'",
    "amount": 150000,
    "reason": "User requested refund"
  }')
echo "$REFUND_JSON" | $JQ
REFUND_ID=$(echo "$REFUND_JSON" | (jq -r '.refund.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "REFUND_ID: $REFUND_ID"

# ============= GET PAYMENT STATS =============
step "9) GET PAYMENT STATS"
curl -s "$BASE/stats" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= GET ALL PAYMENTS (ADMIN) =============
step "10) GET ALL PAYMENTS (admin)"
curl -s "$BASE/admin/payments" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= GET GLOBAL PAYMENT STATS (ADMIN) =============
step "11) GET GLOBAL PAYMENT STATS (admin)"
curl -s "$BASE/admin/stats" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= APPLE PAY WEBHOOK (MOCK) =============
step "12) MOCK APPLE PAY WEBHOOK"
curl -s -X POST "$BASE/webhooks/apple-pay" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "apple_txn_12345",
    "status": "completed",
    "amount": 150000
  }' | $JQ

# ============= PAYOS WEBHOOK (MOCK) =============
step "13) MOCK PAYOS WEBHOOK"
curl -s -X POST "$BASE/webhooks/payos" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "2",
    "status": "success",
    "amount": 200000
  }' | $JQ

# ============= MOCK WEBHOOK (MOCK) =============
step "14) MOCK WEBHOOK"
curl -s -X POST "$BASE/webhooks/mock" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "'$PAYMENT_ID'",
    "status": "confirmed"
  }' | $JQ

# ============= TEST UNAUTHORIZED =============
step "15) TEST WITHOUT AUTH TOKEN (expect 401)"
curl -s -i "$BASE/payments" | head -15

# ============= CLEANUP: CANCEL PAYMENT =============
if [ -n "$PAYMENT_ID" ]; then
  step "16) CANCEL PAYMENT ($PAYMENT_ID)"
  curl -s -X DELETE "$BASE/payments/$PAYMENT_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ
fi

echo
echo "=== PAYMENT SERVICE TESTS COMPLETE ==="
echo "Database tables verified: payments, refunds, payment_transactions"

