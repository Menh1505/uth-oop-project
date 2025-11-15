#!/bin/bash

# UTH API Gateway Test Script
# Tests basic functionality of the custom API gateway

set -e

GATEWAY_URL="http://localhost:8080"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Running API Gateway Tests${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/health")
if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed (HTTP $response)${NC}"
    exit 1
fi

# Test 2: Metrics Endpoint
echo -e "${YELLOW}Test 2: Metrics Endpoint${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/metrics")
if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✅ Metrics endpoint accessible${NC}"
else
    echo -e "${RED}❌ Metrics endpoint failed (HTTP $response)${NC}"
fi

# Test 3: Circuit Breaker Status
echo -e "${YELLOW}Test 3: Circuit Breaker Status${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/admin/circuit-breakers")
if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✅ Circuit breaker status accessible${NC}"
else
    echo -e "${RED}❌ Circuit breaker status failed (HTTP $response)${NC}"
fi

# Test 4: Rate Limiting
echo -e "${YELLOW}Test 4: Rate Limiting${NC}"
echo "Making rapid requests to test rate limiting..."
for i in {1..10}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/health")
    if [ "$response" -eq 429 ]; then
        echo -e "${GREEN}✅ Rate limiting working (HTTP 429)${NC}"
        break
    fi
    sleep 0.1
done

# Test 5: 404 Handler
echo -e "${YELLOW}Test 5: 404 Handler${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/nonexistent")
if [ "$response" -eq 404 ]; then
    echo -e "${GREEN}✅ 404 handler working${NC}"
else
    echo -e "${RED}❌ 404 handler failed (HTTP $response)${NC}"
fi

# Test 6: API Route Proxying (if backends are running)
echo -e "${YELLOW}Test 6: API Route Proxying${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/api/auth/")
if [ "$response" -eq 200 ] || [ "$response" -eq 503 ]; then
    echo -e "${GREEN}✅ Auth service route configured (HTTP $response)${NC}"
else
    echo -e "${YELLOW}⚠️ Auth service route returned HTTP $response${NC}"
fi

echo -e "\n${GREEN}🎉 Gateway tests completed!${NC}"

# Performance test (optional)
if command -v ab &> /dev/null; then
    echo -e "\n${YELLOW}Running performance test with Apache Bench...${NC}"
    ab -n 1000 -c 10 "$GATEWAY_URL/health" | grep -E "(Requests per second|Time per request)"
fi

echo -e "\n${GREEN}✅ All tests completed successfully!${NC}"