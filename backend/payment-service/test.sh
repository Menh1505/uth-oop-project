#!/bin/bash

echo "🧪 Testing Payment Service..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3008"

echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "${BASE_URL}/health")
HEALTH_STATUS=$(echo $HEALTH_RESPONSE | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (Status: $HEALTH_STATUS)${NC}"
    exit 1
fi

echo "Testing subscription plans endpoint..."
PLANS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "${BASE_URL}/api/payments/plans")
PLANS_STATUS=$(echo $PLANS_RESPONSE | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$PLANS_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ Subscription plans endpoint working${NC}"
else
    echo -e "${RED}✗ Subscription plans endpoint failed (Status: $PLANS_STATUS)${NC}"
fi

echo -e "${GREEN}🎉 Payment Service tests completed!${NC}"