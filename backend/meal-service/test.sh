#!/bin/bash

# Test script for Meal Service
echo "🍽️  Testing Meal Service..."

# Check if service is running
curl -s http://localhost:3004/health

if [ $? -eq 0 ]; then
    echo "✅ Service is running"
else
    echo "❌ Service is not running. Please start it first with: npm run dev"
    exit 1
fi

echo ""
echo "Testing endpoints (requires JWT token):"
echo "1. Health check:"
echo "   curl http://localhost:3004/health"
echo ""
echo "2. Get meal status:"
echo "   curl http://localhost:3004/meals/status"
echo ""
echo "3. Search foods:"
echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:3004/foods?search_term=chicken"
echo ""
echo "4. Get food categories:"
echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:3004/foods/categories/all"
echo ""
echo "5. Create meal:"
echo "   curl -X POST -H 'Authorization: Bearer YOUR_TOKEN' -H 'Content-Type: application/json' \\"
echo "        -d '{\"meal_type\":\"Breakfast\",\"meal_date\":\"2024-11-15\"}' \\"
echo "        http://localhost:3004/meals"
echo ""
echo "Note: Replace YOUR_TOKEN with actual JWT token from auth service"