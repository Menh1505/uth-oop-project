#!/bin/bash

echo "=== CHECKING MEAL-SERVICE BUILD & LOGS ==="
echo ""

echo "1. Checking meal-service logs:"
docker compose logs meal-service 2>&1 | tail -100

echo ""
echo "2. Checking nginx logs:"
docker compose logs nginx 2>&1 | tail -50

echo ""
echo "3. Checking if meal-service is running:"
docker compose ps meal-service

echo ""
echo "4. Testing meal-service health endpoint directly:"
docker compose exec -T meal-service curl -s http://localhost:3004/health 2>&1 || echo "Failed to connect to meal-service"

echo ""
echo "5. Testing nginx routing:"
docker compose exec -T nginx curl -s http://localhost/api/meals/ 2>&1 || echo "Failed to connect via nginx"

echo ""
echo "6. Checking meal-service container status:"
docker compose ps

echo ""
echo "Done!"
