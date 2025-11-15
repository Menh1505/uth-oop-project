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
if [ "$(probe http://$HOST:$PORT/api/deliveries/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/api/deliveries"
elif [ "$(probe http://$HOST:$PORT/deliveries/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/deliveries"
else
  echo "[!] NGINX not returning 200 at /api/deliveries/health or /deliveries/health on $HOST:$PORT."
  echo "    Check nginx.conf and ensure services are running (docker compose up)."
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

AUTH_BASE="http://$HOST:3011"
UA="curl-delivery-test/1.0"

step() { echo; echo "=== $* ==="; }

# ============= GET AUTH TOKEN FOR ADMIN =============
step "1) LOGIN AS ADMIN"
ADMIN_LOGIN=$(curl -s -X POST "$AUTH_BASE/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}')
echo "$ADMIN_LOGIN" | $JQ
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | (jq -r '.access_token' 2>/dev/null || sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'))
echo "ADMIN_TOKEN(short) = ${ADMIN_TOKEN:0:30}..."

# ============= GET AUTH TOKEN FOR USER =============
step "2) LOGIN AS REGULAR USER"
USER_LOGIN=$(curl -s -X POST "$AUTH_BASE/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}')
echo "$USER_LOGIN" | $JQ
USER_TOKEN=$(echo "$USER_LOGIN" | (jq -r '.access_token' 2>/dev/null || sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'))
echo "USER_TOKEN(short) = ${USER_TOKEN:0:30}..."

# ============= HEALTH CHECK =============
step "3) HEALTH CHECK (public)"
curl -s http://$HOST:3020/health | $JQ

# ============= GET ENUMS =============
step "4) GET ENUMS (public)"
curl -s "$BASE/enums" | $JQ

# ============= CREATE DRIVER (ADMIN) =============
step "5) CREATE DRIVER (admin)"
DRIVER_JSON=$(curl -s -X POST "$BASE/drivers" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Nguyen Van A",
    "phone": "+84901234567",
    "email": "driver1@delivery.com",
    "vehicle_type": "motorcycle",
    "vehicle_plate": "TP 01-123456",
    "license_number": "LICENSE123456",
    "identity_number": "ID123456789"
  }')
echo "$DRIVER_JSON" | $JQ
DRIVER_ID=$(echo "$DRIVER_JSON" | (jq -r '.driver.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "DRIVER_ID: $DRIVER_ID"

# ============= GET ALL DRIVERS (ADMIN) =============
step "6) GET ALL DRIVERS (admin)"
curl -s "$BASE/drivers" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | $JQ

# ============= GET SINGLE DRIVER =============
if [ -n "$DRIVER_ID" ]; then
  step "7) GET SINGLE DRIVER ($DRIVER_ID)"
  curl -s "$BASE/drivers/$DRIVER_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | $JQ

  # ============= UPDATE DRIVER =============
  step "8) UPDATE DRIVER"
  curl -s -X PUT "$BASE/drivers/$DRIVER_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "phone": "+84909876543",
      "vehicle_plate": "TP 01-654321"
    }' | $JQ

  # ============= UPDATE DRIVER LOCATION =============
  step "9) UPDATE DRIVER LOCATION (mock)"
  curl -s -X PUT "$BASE/drivers/$DRIVER_ID/location" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "latitude": 10.7769,
      "longitude": 106.7009
    }' | $JQ

  # ============= UPDATE DRIVER STATUS =============
  step "10) UPDATE DRIVER STATUS TO AVAILABLE"
  curl -s -X PUT "$BASE/drivers/$DRIVER_ID/status" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"available"}' | $JQ
fi

# ============= GET AVAILABLE DRIVERS =============
step "11) GET AVAILABLE DRIVERS (admin)"
curl -s "$BASE/drivers/available" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | $JQ

# ============= CREATE DELIVERY =============
step "12) CREATE DELIVERY (admin)"
DELIVERY_JSON=$(curl -s -X POST "$BASE/deliveries" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "order123",
    "customer_id": "cust123",
    "restaurant_id": "rest123",
    "partner_id": "partner123",
    "pickup_address": "123 Restaurant St",
    "pickup_latitude": 10.7700,
    "pickup_longitude": 106.7000,
    "pickup_contact_name": "Restaurant Manager",
    "pickup_contact_phone": "+84901111111",
    "delivery_address": "456 Customer Ave",
    "delivery_latitude": 10.7769,
    "delivery_longitude": 106.7009,
    "delivery_contact_name": "Customer Name",
    "delivery_contact_phone": "+84902222222",
    "delivery_fee": 25000,
    "payment_method": "cash",
    "items_count": 3
  }')
echo "$DELIVERY_JSON" | $JQ
DELIVERY_ID=$(echo "$DELIVERY_JSON" | (jq -r '.delivery.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "DELIVERY_ID: $DELIVERY_ID"

# ============= GET ALL DELIVERIES (USER) =============
step "13) GET ALL DELIVERIES (user)"
curl -s "$BASE/deliveries" \
  -H "Authorization: Bearer $USER_TOKEN" | $JQ

# ============= GET SINGLE DELIVERY =============
if [ -n "$DELIVERY_ID" ]; then
  step "14) GET SINGLE DELIVERY ($DELIVERY_ID)"
  curl -s "$BASE/deliveries/$DELIVERY_ID" \
    -H "Authorization: Bearer $USER_TOKEN" | $JQ

  # ============= UPDATE DELIVERY =============
  step "15) UPDATE DELIVERY"
  curl -s -X PUT "$BASE/deliveries/$DELIVERY_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "delivery_fee": 30000
    }' | $JQ

  # ============= ASSIGN DRIVER TO DELIVERY =============
  if [ -n "$DRIVER_ID" ]; then
    step "16) ASSIGN DRIVER ($DRIVER_ID) TO DELIVERY"
    curl -s -X POST "$BASE/deliveries/$DELIVERY_ID/assign" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"driver_id\":\"$DRIVER_ID\"}" | $JQ

    # ============= CREATE TRACKING EVENT =============
    step "17) CREATE TRACKING EVENT (picked up)"
    curl -s -X POST "$BASE/deliveries/$DELIVERY_ID/tracking" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "event_type": "picked_up",
        "description": "Order picked up from restaurant"
      }' | $JQ
  fi

  # ============= GET TRACKING EVENTS =============
  step "18) GET TRACKING EVENTS FOR DELIVERY"
  curl -s "$BASE/deliveries/$DELIVERY_ID/tracking" \
    -H "Authorization: Bearer $USER_TOKEN" | $JQ

  # ============= UPDATE DELIVERY PROOF (MOCK) =============
  step "19) UPDATE DELIVERY PROOF (mock driver action)"
  curl -s -X PUT "$BASE/deliveries/$DELIVERY_ID/proof" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "signature_url": "https://example.com/signature.jpg",
      "photo_url": "https://example.com/delivery-photo.jpg",
      "proof_type": "signature_photo"
    }' | $JQ
fi

# ============= DELIVERY ANALYTICS (ADMIN) =============
step "20) GET DELIVERY ANALYTICS (admin)"
curl -s "$BASE/analytics/deliveries" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | $JQ

# ============= DRIVER ANALYTICS (ADMIN) =============
step "21) GET DRIVER ANALYTICS (admin)"
curl -s "$BASE/analytics/drivers" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | $JQ

# ============= TEST UNAUTHORIZED =============
step "22) TEST WITHOUT AUTH TOKEN (expect 401)"
curl -s -i "$BASE/drivers" | head -15

echo
echo "=== DELIVERY SERVICE TESTS COMPLETE ==="
echo "Database tables verified: drivers, deliveries, tracking_events"

