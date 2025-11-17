#!/bin/bash

# Goal Service Test Script
# This script tests the basic functionality of the goal service

echo "🎯 Goal Service Testing Script"
echo "=============================="

# Configuration
BASE_URL="http://localhost:3006"
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

echo -e "\n2. Create Goal (Admin)"
goal_data='{
  "goal_type": "Reduce Fat",
  "target_calories": 2000,
  "target_protein": 120,
  "target_carbs": 200,
  "target_fat": 70,
  "target_weight": 75,
  "target_duration_weeks": 12,
  "description": "Healthy fat loss goal for testing"
}'
make_request POST "/goals" "$goal_data" "Create new goal"

echo -e "\n3. Get All Goals"
make_request GET "/goals?limit=5&goal_type=Reduce%20Fat" "" "Get goals with filters"

echo -e "\n4. Get Popular Goals"
make_request GET "/goals/popular/list?limit=3" "" "Get popular goals"

echo -e "\n5. Assign Goal to User"
assign_data='{
  "goal_id": "test-goal-id",
  "target_completion_date": "2024-03-01",
  "notes": "Starting my fitness journey"
}'
make_request POST "/goals/user-goals" "$assign_data" "Assign goal to user"

echo -e "\n6. Get User Goals"
make_request GET "/goals/user-goals?status=Active&limit=5" "" "Get user goals"

echo -e "\n7. Update User Goal Progress"
progress_data='{
  "progress_percentage": 45
}'
make_request PUT "/goals/user-goals/test-user-goal-id/progress" "$progress_data" "Update goal progress"

echo -e "\n8. Get User Goal Statistics"
make_request GET "/goals/statistics/user" "" "Get user goal statistics"

echo -e "\n9. Get Goal Progress Details"
make_request GET "/goals/user-goals/test-user-goal-id/progress" "" "Get goal progress details"

echo -e "\n10. Get Goal Recommendations"
make_request GET "/goals/recommendations/goals" "" "Get goal recommendations"

echo -e "\n11. Get Goal Templates"
make_request GET "/goals/templates/list" "" "Get goal templates"

echo -e "\n12. Get Smart Goal Suggestions"
make_request GET "/goals/suggestions/smart" "" "Get smart goal suggestions"

echo -e "\n13. Get Goals Near Deadline"
make_request GET "/goals/deadline/near?days=7" "" "Get goals near deadline"

echo -e "\n14. Get Recent Goal Activity"
make_request GET "/goals/activity/recent?days=30" "" "Get recent goal activity"

echo -e "\n15. Get Goal Adjustment Suggestions"
make_request GET "/goals/user-goals/test-user-goal-id/suggestions" "" "Get goal adjustment suggestions"

echo -e "\n16. Create Goal from Template"
template_data='{
  "customizations": {
    "calories": 1800,
    "duration_weeks": 10
  }
}'
make_request POST "/goals/templates/template-1/create" "$template_data" "Create goal from template"

echo -e "\n17. Update User Goal"
update_data='{
  "progress_percentage": 65,
  "status": "Active",
  "notes": "Making good progress"
}'
make_request PUT "/goals/user-goals/test-user-goal-id" "$update_data" "Update user goal"

echo -e "\n18. Invalid Endpoint Test"
make_request GET "/invalid-endpoint" "" "Test 404 handling"

echo -e "\n${YELLOW}Testing completed!${NC}"
echo -e "\nNote: Some tests may fail if:"
echo -e "- Service is not running on $BASE_URL"
echo -e "- Database is not properly configured"
echo -e "- JWT token is invalid or expired"
echo -e "- Required test data doesn't exist in database"
echo -e "\nTo start the service:"
echo -e "cd goal-service && npm run dev"

echo -e "\n${YELLOW}Goal Service Features Tested:${NC}"
echo -e "✓ Goal CRUD operations"
echo -e "✓ User goal assignment and management"
echo -e "✓ Progress tracking and updates"
echo -e "✓ Goal statistics and analytics"
echo -e "✓ Smart recommendations"
echo -e "✓ Goal templates"
echo -e "✓ Adjustment suggestions"
echo -e "✓ Deadline and activity tracking"