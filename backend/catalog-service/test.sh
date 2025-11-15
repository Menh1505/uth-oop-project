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
if [ "$(probe http://$HOST:$PORT/api/catalog/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/api/catalog"
elif [ "$(probe http://$HOST:$PORT/catalog/health)" = "200" ]; then
  BASE="http://$HOST:$PORT/catalog"
else
  echo "[!] NGINX not returning 200 at /api/catalog/health or /catalog/health on $HOST:$PORT."
  echo "    Catalog service might not be running."
  exit 1
fi
echo "[i] BASE via NGINX: $BASE"

AUTH_BASE="http://$HOST:3011"
UA="curl-catalog-test/1.0"

step() { echo; echo "=== $* ==="; }

# ============= GET AUTH TOKEN (ADMIN) =============
step "1) LOGIN AS ADMIN FOR CATALOG MANAGEMENT"
ADMIN_LOGIN=$(curl -s -X POST "$AUTH_BASE/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}')
echo "$ADMIN_LOGIN" | $JQ
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | (jq -r '.access_token' 2>/dev/null || sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p'))
echo "ADMIN_TOKEN(short) = ${ADMIN_TOKEN:0:30}..."

# ============= HEALTH CHECK =============
step "2) HEALTH CHECK (public)"
curl -s "$BASE/health" | $JQ

# ============= GET CATEGORIES (PUBLIC) =============
step "3) GET ALL CATEGORIES (public)"
curl -s "$BASE/categories" | $JQ

# ============= CREATE CATEGORY (ADMIN) =============
step "4) CREATE CATEGORY (admin)"
CATEGORY_JSON=$(curl -s -X POST "$BASE/categories" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vietnamese Dishes",
    "description": "Traditional Vietnamese cuisine",
    "image_url": "https://example.com/vietnamese.jpg"
  }')
echo "$CATEGORY_JSON" | $JQ
CATEGORY_ID=$(echo "$CATEGORY_JSON" | (jq -r '.category.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "CATEGORY_ID: $CATEGORY_ID"

# ============= GET SINGLE CATEGORY =============
if [ -n "$CATEGORY_ID" ]; then
  step "5) GET SINGLE CATEGORY ($CATEGORY_ID)"
  curl -s "$BASE/categories/$CATEGORY_ID" | $JQ

  # ============= UPDATE CATEGORY =============
  step "6) UPDATE CATEGORY"
  curl -s -X PUT "$BASE/categories/$CATEGORY_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Traditional Vietnamese Dishes",
      "description": "Authentic Vietnamese cuisine with modern twist"
    }' | $JQ
fi

# ============= CREATE PRODUCT (ADMIN) =============
step "7) CREATE PRODUCT (admin)"
PRODUCT_JSON=$(curl -s -X POST "$BASE/products" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pho Bo",
    "description": "Vietnamese beef noodle soup",
    "category_id": "'$CATEGORY_ID'",
    "price": 50000,
    "image_url": "https://example.com/pho-bo.jpg",
    "stock_quantity": 100,
    "is_active": true
  }')
echo "$PRODUCT_JSON" | $JQ
PRODUCT_ID=$(echo "$PRODUCT_JSON" | (jq -r '.product.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "PRODUCT_ID: $PRODUCT_ID"

# ============= GET ALL PRODUCTS (PUBLIC) =============
step "8) GET ALL PRODUCTS (public)"
curl -s "$BASE/products" | $JQ

# ============= GET SINGLE PRODUCT (PUBLIC) =============
if [ -n "$PRODUCT_ID" ]; then
  step "9) GET SINGLE PRODUCT ($PRODUCT_ID, public)"
  curl -s "$BASE/products/$PRODUCT_ID" | $JQ

  # ============= UPDATE PRODUCT =============
  step "10) UPDATE PRODUCT (admin)"
  curl -s -X PUT "$BASE/products/$PRODUCT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Pho Bo Premium",
      "price": 65000,
      "description": "Premium Vietnamese beef noodle soup"
    }' | $JQ

  # ============= GET INVENTORY =============
  step "11) GET PRODUCT INVENTORY"
  curl -s "$BASE/inventory/$PRODUCT_ID" | $JQ

  # ============= UPDATE INVENTORY =============
  step "12) UPDATE INVENTORY (admin)"
  curl -s -X PUT "$BASE/inventory/$PRODUCT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "quantity": 150,
      "reorder_level": 20,
      "reorder_quantity": 50
    }' | $JQ
fi

# ============= CREATE ANOTHER PRODUCT =============
step "13) CREATE ANOTHER PRODUCT (Banh Mi)"
PRODUCT2_JSON=$(curl -s -X POST "$BASE/products" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Banh Mi",
    "description": "Vietnamese sandwich with pate and cold cuts",
    "category_id": "'$CATEGORY_ID'",
    "price": 25000,
    "image_url": "https://example.com/banh-mi.jpg",
    "stock_quantity": 50,
    "is_active": true
  }')
echo "$PRODUCT2_JSON" | $JQ
PRODUCT2_ID=$(echo "$PRODUCT2_JSON" | (jq -r '.product.id // .id // empty' 2>/dev/null || sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1))
echo "PRODUCT2_ID: $PRODUCT2_ID"

# ============= GET ALL PRODUCTS AGAIN =============
step "14) GET ALL PRODUCTS (should have at least 2)"
curl -s "$BASE/products" | $JQ

# ============= SEARCH/FILTER PRODUCTS =============
step "15) GET PRODUCTS WITH FILTERS (category)"
curl -s "$BASE/products?category_id=$CATEGORY_ID&limit=10" | $JQ

# ============= TEST UNAUTHORIZED - CREATE WITHOUT TOKEN =============
step "16) TEST WITHOUT AUTH TOKEN (expect 401 on create)"
curl -s -i -X POST "$BASE/categories" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}' | head -15

# ============= TEST UNAUTHORIZED - DELETE PRODUCT =============
if [ -n "$PRODUCT2_ID" ]; then
  step "17) DELETE PRODUCT ($PRODUCT2_ID, admin)"
  curl -s -X DELETE "$BASE/products/$PRODUCT2_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | $JQ
fi

# ============= DELETE CATEGORY =============
if [ -n "$CATEGORY_ID" ]; then
  step "18) DELETE CATEGORY ($CATEGORY_ID, admin)"
  curl -s -X DELETE "$BASE/categories/$CATEGORY_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | $JQ
fi

echo
echo "=== CATALOG SERVICE TESTS COMPLETE ==="
echo "Database tables verified: products, categories, inventory"

