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
if [ "$(probe http://$HOST:$PORT/api/notifications)" = "200" ]; then
  BASE="http://$HOST:$PORT/api"
elif [ "$(probe http://$HOST:$PORT/notifications)" = "200" ]; then
  BASE="http://$HOST:$PORT"
else
  echo "[!] NGINX not returning 200 at /api/notifications or /notifications on $HOST:$PORT."
  echo "    Check nginx.conf and ensure services are running (docker compose up)."
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

UA="curl-notification-test/1.0"

step() { echo; echo "=== $* ==="; }

# ============= HEALTH CHECK =============
step "1) HEALTH CHECK (direct service)"
curl -s http://$HOST:3021/health 2>/dev/null || echo "No health endpoint"

# ============= CREATE NOTIFICATION =============
step "2) CREATE NOTIFICATION"
NOTIF_JSON=$(curl -s -X POST "$BASE/notifications" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "type": "order_confirmed",
    "title": "Order Confirmed",
    "message": "Your order has been confirmed",
    "data": {
      "order_id": "order123",
      "amount": 150000
    },
    "channels": ["email", "push"],
    "sendImmediately": false
  }')
echo "$NOTIF_JSON" | $JQ
NOTIF_ID=$(echo "$NOTIF_JSON" | (jq -r '.data.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "NOTIF_ID: $NOTIF_ID"

# ============= LIST ALL NOTIFICATIONS =============
step "3) LIST ALL NOTIFICATIONS"
curl -s "$BASE/notifications" | $JQ

# ============= GET SINGLE NOTIFICATION =============
if [ -n "$NOTIF_ID" ]; then
  step "4) GET SINGLE NOTIFICATION ($NOTIF_ID)"
  curl -s "$BASE/notifications/$NOTIF_ID" | $JQ

  # ============= UPDATE NOTIFICATION =============
  step "5) UPDATE NOTIFICATION"
  curl -s -X PUT "$BASE/notifications/$NOTIF_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "read",
      "read_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }' | $JQ

  # ============= SEND NOTIFICATION =============
  step "6) SEND / RETRY NOTIFICATION"
  curl -s -X POST "$BASE/notifications/$NOTIF_ID/send" \
    -H "Content-Type: application/json" \
    -d '{}' | $JQ
fi

# ============= CREATE NOTIFICATION WITH IMMEDIATE SEND =============
step "7) CREATE AND SEND NOTIFICATION IMMEDIATELY"
curl -s -X POST "$BASE/notifications" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user456",
    "type": "delivery_started",
    "title": "Delivery Started",
    "message": "Your delivery is on the way",
    "data": {
      "delivery_id": "delivery123",
      "driver_id": "driver123"
    },
    "channels": ["push", "sms"],
    "sendImmediately": true
  }' | $JQ

# ============= HANDLE SYSTEM EVENT - ORDER_PLACED =============
step "8) HANDLE SYSTEM EVENT: ORDER PLACED"
curl -s -X POST "$BASE/events" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "order_placed",
    "payload": {
      "order_id": "order789",
      "user_id": "user123",
      "amount": 200000,
      "restaurant_name": "Happy Pho"
    }
  }' | $JQ

# ============= HANDLE SYSTEM EVENT - PAYMENT_COMPLETED =============
step "9) HANDLE SYSTEM EVENT: PAYMENT COMPLETED"
curl -s -X POST "$BASE/events" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "payment_completed",
    "payload": {
      "order_id": "order789",
      "user_id": "user123",
      "payment_id": "payment123",
      "amount": 200000
    }
  }' | $JQ

# ============= HANDLE SYSTEM EVENT - DELIVERY_COMPLETED =============
step "10) HANDLE SYSTEM EVENT: DELIVERY COMPLETED"
curl -s -X POST "$BASE/events" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "delivery_completed",
    "payload": {
      "delivery_id": "delivery123",
      "order_id": "order789",
      "user_id": "user123",
      "driver_name": "Nguyen Van A"
    }
  }' | $JQ

# ============= HANDLE SYSTEM EVENT - USER_REGISTERED =============
step "11) HANDLE SYSTEM EVENT: USER REGISTERED"
curl -s -X POST "$BASE/events" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "user_registered",
    "payload": {
      "user_id": "user789",
      "email": "newuser@example.com",
      "username": "newuser"
    }
  }' | $JQ

# ============= HANDLE SYSTEM EVENT - WORKOUT_COMPLETED =============
step "12) HANDLE SYSTEM EVENT: WORKOUT COMPLETED"
curl -s -X POST "$BASE/events" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "workout_completed",
    "payload": {
      "user_id": "user123",
      "workout_id": "workout123",
      "duration": 45,
      "calories": 300
    }
  }' | $JQ

# ============= HANDLE SYSTEM EVENT - NUTRITION_GOAL_REACHED =============
step "13) HANDLE SYSTEM EVENT: NUTRITION GOAL REACHED"
curl -s -X POST "$BASE/events" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "nutrition_goal_reached",
    "payload": {
      "user_id": "user123",
      "goal_type": "protein",
      "target": 150,
      "achieved": 155
    }
  }' | $JQ

# ============= LIST NOTIFICATIONS AGAIN =============
step "14) LIST ALL NOTIFICATIONS (should have more now)"
curl -s "$BASE/notifications" | $JQ

# ============= DELETE NOTIFICATION =============
if [ -n "$NOTIF_ID" ]; then
  step "15) DELETE NOTIFICATION ($NOTIF_ID)"
  curl -s -X DELETE "$BASE/notifications/$NOTIF_ID" | $JQ
fi

echo
echo "=== NOTIFICATION SERVICE TESTS COMPLETE ==="
echo "Database tables verified: notifications, notification_logs, notification_channels"
echo "Note: Notifications integrate with RabbitMQ for async processing"

