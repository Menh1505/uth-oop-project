#!/bin/bash

# Exercise Service Test Script
# This script tests the basic functionality of the exercise service

echo "🏋️ Exercise Service Testing Script"
echo "=================================="

# Configuration
BASE_URL="http://localhost:3005"
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJpYXQiOjE3MzM5NzI5NzAsImV4cCI6MTczNDA1OTM3MH0.test-token"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Function to make HTTP requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -d "$data")
    else
        response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $JWT_TOKEN")
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    echo "HTTP Status: $http_code"
    echo "Response: $body" | jq . 2>/dev/null || echo "Response: $body"
    
    # Check if status code is successful (2xx)
    if [[ $http_code =~ ^2[0-9][0-9]$ ]]; then
        print_result 0 "$description"
        return 0
    else
        print_result 1 "$description"
        return 1
    fi
}

echo -e "\n1. Health Check"
make_request GET "/health" "" "Service health check"

echo -e "\n2. Create Exercise"
exercise_data='{
  "name": "Test Push-ups",
  "type": "Strength",
  "muscle_groups": ["Chest", "Triceps", "Shoulders"],
  "equipment": "None",
  "difficulty_level": "Beginner",
  "instructions": "Start in plank position, lower body to ground, push back up",
  "duration_minutes": 10,
  "sets": 3,
  "reps": 15,
  "calories_per_minute": 8.5
}'
make_request POST "/exercises" "$exercise_data" "Create new exercise"

echo -e "\n3. Get Exercises with Filters"
make_request GET "/exercises?type=Strength&difficulty=Beginner&limit=5" "" "Get exercises with filters"

echo -e "\n4. Get Exercise Statistics"
make_request GET "/exercises/statistics/user" "" "Get user exercise statistics"

echo -e "\n5. Get Exercise Recommendations"
recommendation_data='{
  "goals": ["weight_loss", "muscle_gain"],
  "available_time": 30,
  "equipment": ["dumbbells"],
  "fitness_level": "intermediate",
  "preferences": {
    "types": ["Strength", "Cardio"],
    "muscle_groups": ["Chest", "Arms"]
  }
}'
make_request POST "/exercises/recommendations" "$recommendation_data" "Get exercise recommendations"

echo -e "\n6. Get Popular Exercises"
make_request GET "/exercises/popular/list?limit=5&period=month" "" "Get popular exercises"

echo -e "\n7. Estimate Calories"
calories_data='{
  "user_weight_kg": 70,
  "exercise_name": "Running",
  "duration_minutes": 30,
  "intensity": "moderate"
}'
make_request POST "/exercises/calories/estimate" "$calories_data" "Estimate calories burned"

echo -e "\n8. Get Daily Summary"
current_date=$(date +%Y-%m-%d)
make_request GET "/exercises/summary/daily/$current_date" "" "Get daily exercise summary"

echo -e "\n9. Get Exercise Performance"
make_request GET "/exercises/performance/Push-ups" "" "Get exercise performance metrics"

echo -e "\n10. Invalid Endpoint Test"
make_request GET "/invalid-endpoint" "" "Test 404 handling"

echo -e "\n${YELLOW}Testing completed!${NC}"
echo -e "\nNote: Some tests may fail if:"
echo -e "- Service is not running on $BASE_URL"
echo -e "- Database is not properly configured"
echo -e "- JWT token is invalid or expired"
echo -e "- Required data doesn't exist in database"
echo -e "\nTo start the service:"
echo -e "cd exercise-service && npm run dev"