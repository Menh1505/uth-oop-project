#!/usr/bin/env bash
set -euo pipefail

# Master Test Script for All Microservices
# This script runs comprehensive tests for all backend services

HOST=${HOST:-localhost}
PORT=${PORT:-3000}
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================================"
echo "  COMPREHENSIVE MICROSERVICES TEST SUITE"
echo "======================================================================"
echo "Host: $HOST"
echo "Port: $PORT"
echo "Date: $(date)"
echo "======================================================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
PASSED=0
FAILED=0
SERVICES=(
  "auth-service"
  "user-service"
  "admin-service"
  "workout-service"
  "nutrition-service"
  "order-service"
  "payment-service"
  "partner-service"
  "delivery-service"
  "notification-service"
  "recommendation-service"
  "catalog-service"
)

run_service_test() {
  local service=$1
  local test_file="$BACKEND_DIR/$service/test.sh"
  
  if [ ! -f "$test_file" ]; then
    echo -e "${RED}✗ $service${NC}: Test file not found ($test_file)"
    ((FAILED++))
    return 1
  fi
  
  echo "======================================================================"
  echo -e "${YELLOW}Testing: $service${NC}"
  echo "======================================================================"
  
  if bash "$test_file" 2>&1; then
    echo -e "${GREEN}✓ $service PASSED${NC}"
    ((PASSED++))
    echo ""
    return 0
  else
    echo -e "${RED}✗ $service FAILED${NC}"
    ((FAILED++))
    echo ""
    return 1
  fi
}

# Run all tests
for service in "${SERVICES[@]}"; do
  run_service_test "$service" || true
done

# Summary
echo "======================================================================"
echo "  TEST SUMMARY"
echo "======================================================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo "======================================================================"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Check output above for details.${NC}"
  exit 1
fi

