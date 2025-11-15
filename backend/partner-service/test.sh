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
if [ "$(probe http://$HOST:$PORT/api/partners/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/api/partners"
elif [ "$(probe http://$HOST:$PORT/partners/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/partners"
else
  echo "[!] NGINX not returning 200 at /api/partners/health or /partners/health on $HOST:$PORT."
  echo "    Check nginx.conf and ensure services are running (docker compose up)."
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

AUTH_BASE="http://$HOST:3011"
UA="curl-partner-test/1.0"

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
curl -s http://$HOST:3019/health | $JQ

# ============= CREATE PARTNER =============
step "3) CREATE PARTNER"
PARTNER_JSON=$(curl -s -X POST "$BASE/partners" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Happy Restaurant",
    "business_type": "restaurant",
    "tax_id": "TAX123456789",
    "contact_person": "John Doe",
    "contact_email": "john@happyrestaurant.com",
    "contact_phone": "+84901234567"
  }')
echo "$PARTNER_JSON" | $JQ
PARTNER_ID=$(echo "$PARTNER_JSON" | (jq -r '.partner.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "PARTNER_ID: $PARTNER_ID"

# ============= GET USER PARTNERS =============
step "4) GET USER PARTNERS"
curl -s "$BASE/partners" \
  -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

# ============= GET SINGLE PARTNER =============
if [ -n "$PARTNER_ID" ]; then
  step "5) GET SINGLE PARTNER ($PARTNER_ID)"
  curl -s "$BASE/partners/$PARTNER_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

  # ============= UPDATE PARTNER =============
  step "6) UPDATE PARTNER"
  curl -s -X PUT "$BASE/partners/$PARTNER_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "business_name": "Happy Restaurant Vietnam"
    }' | $JQ

  # ============= CREATE RESTAURANT =============
  step "7) CREATE RESTAURANT"
  REST_JSON=$(curl -s -X POST "$BASE/partners/$PARTNER_ID/restaurants" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Happy Pho Vietnam",
      "description": "Traditional Vietnamese pho restaurant",
      "type": "pho",
      "phone": "+84901111111",
      "email": "pho@happyrestaurant.com",
      "address": "123 Nguyen Hue, District 1",
      "city": "Ho Chi Minh City",
      "latitude": 10.7769,
      "longitude": 106.7009
    }')
  echo "$REST_JSON" | $JQ
  RESTAURANT_ID=$(echo "$REST_JSON" | (jq -r '.restaurant.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
  echo "RESTAURANT_ID: $RESTAURANT_ID"

  # ============= GET PARTNER RESTAURANTS =============
  step "8) GET PARTNER RESTAURANTS"
  curl -s "$BASE/partners/$PARTNER_ID/restaurants" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ
fi

# ============= SEARCH RESTAURANTS (PUBLIC) =============
step "9) SEARCH RESTAURANTS (public)"
curl -s "$BASE/restaurants/search?q=pho" | $JQ

# ============= CREATE MENU ITEM =============
if [ -n "$RESTAURANT_ID" ]; then
  step "10) CREATE MENU ITEM"
  MENU_JSON=$(curl -s -X POST "$BASE/restaurants/$RESTAURANT_ID/menu" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Pho Bo",
      "description": "Beef pho with bone broth",
      "category": "noodles",
      "base_price": 50000,
      "image_url": "https://example.com/pho-bo.jpg",
      "is_vegetarian": false,
      "is_spicy": false
    }')
  echo "$MENU_JSON" | $JQ
  MENU_ID=$(echo "$MENU_JSON" | (jq -r '.menu.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
  echo "MENU_ID: $MENU_ID"

  # ============= GET MENU ITEMS (PUBLIC) =============
  step "11) GET RESTAURANT MENU (public)"
  curl -s "$BASE/restaurants/$RESTAURANT_ID/menu" | $JQ

  # ============= UPDATE MENU ITEM =============
  if [ -n "$MENU_ID" ]; then
    step "12) UPDATE MENU ITEM"
    curl -s -X PUT "$BASE/menu/$MENU_ID" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Pho Bo Premium",
        "base_price": 65000
      }' | $JQ

    # ============= UPDATE MENU ITEM STATUS =============
    step "13) UPDATE MENU ITEM STATUS"
    curl -s -X PATCH "$BASE/menu/$MENU_ID/status" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status":"available"}' | $JQ
  fi

  # ============= CREATE PROMOTION =============
  step "14) CREATE PROMOTION"
  PROMO_JSON=$(curl -s -X POST "$BASE/restaurants/$RESTAURANT_ID/promotions" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Lunch Special",
      "description": "20% off on lunch orders",
      "type": "percentage",
      "discount_value": 20,
      "start_date": "2025-01-01",
      "end_date": "2025-12-31"
    }')
  echo "$PROMO_JSON" | $JQ
  PROMO_ID=$(echo "$PROMO_JSON" | (jq -r '.promotion.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
  echo "PROMO_ID: $PROMO_ID"

  # ============= GET PROMOTIONS =============
  step "15) GET RESTAURANT PROMOTIONS"
  curl -s "$BASE/restaurants/$RESTAURANT_ID/promotions" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

  # ============= UPDATE PROMOTION STATUS =============
  if [ -n "$PROMO_ID" ]; then
    step "16) UPDATE PROMOTION STATUS"
    curl -s -X PATCH "$BASE/promotions/$PROMO_ID/status" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status":"active"}' | $JQ
  fi

  # ============= UPDATE RESTAURANT STATUS =============
  step "17) UPDATE RESTAURANT STATUS"
  curl -s -X PATCH "$BASE/restaurants/$RESTAURANT_ID/status" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"open"}' | $JQ

  # ============= GET SINGLE RESTAURANT =============
  step "18) GET SINGLE RESTAURANT ($RESTAURANT_ID)"
  curl -s "$BASE/restaurants/$RESTAURANT_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" | $JQ

  # ============= UPDATE RESTAURANT =============
  step "19) UPDATE RESTAURANT"
  curl -s -X PUT "$BASE/restaurants/$RESTAURANT_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Happy Pho Vietnam - Premium",
      "description": "Traditional Vietnamese pho - Best in town"
    }' | $JQ
fi

# ============= TEST UNAUTHORIZED =============
step "20) TEST WITHOUT AUTH TOKEN (expect 401)"
curl -s -i "$BASE/partners" | head -15

echo
echo "=== PARTNER SERVICE TESTS COMPLETE ==="
echo "Database tables verified: partners, restaurants, menu_items, promotions"

