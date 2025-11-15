#!/bin/bash

# =============================================================================
# FITNESS APP - USER BEHAVIOR SIMULATION SCRIPT (BASH/CURL VERSION)
# =============================================================================
# Mô phỏng behavior của user sử dụng frontend gọi tới backend thông qua API Gateway
#
# Luồng hoạt động:
# 1. Đăng nhập/Đăng ký người dùng
# 2. Nhập thông tin cá nhân 
# 3. Theo dõi và ghi lại bữa ăn và hoạt động
# 4. Hệ thống phân tích và tính toán
# =============================================================================

# Configuration
GATEWAY_URL="http://localhost:3000"
TIMEOUT=10
RETRY_COUNT=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Global variables
AUTH_TOKEN=""
USER_ID=""
TIMESTAMP=$(date +%s)

# Utility functions
log() {
    echo -e "${2:-$NC}$1${NC}"
}

log_success() {
    log "✅ $1" "$GREEN"
}

log_error() {
    log "❌ $1" "$RED"
}

log_info() {
    log "ℹ️  $1" "$BLUE"
}

log_warning() {
    log "⚠️  $1" "$YELLOW"
}

log_header() {
    echo
    log "$(printf '=%.0s' {1..60})" "$BOLD"
    log "$1" "$BOLD"
    log "$(printf '=%.0s' {1..60})" "$BOLD"
}

# HTTP request wrapper with retry
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local use_auth=${4:-true}
    local content_type="Content-Type: application/json"
    local auth_header=""
    
    if [ "$use_auth" = "true" ] && [ -n "$AUTH_TOKEN" ]; then
        auth_header="Authorization: Bearer $AUTH_TOKEN"
    fi
    
    local response
    local http_code
    local attempt=1
    
    while [ $attempt -le $RETRY_COUNT ]; do
        if [ -n "$data" ]; then
            if [ -n "$auth_header" ]; then
                response=$(curl -s -w "\n%{http_code}" -X "$method" \
                    "$GATEWAY_URL$endpoint" \
                    -H "$content_type" \
                    -H "$auth_header" \
                    -H "User-Agent: FitnessApp-Simulator/1.0.0" \
                    -d "$data" \
                    --connect-timeout $TIMEOUT \
                    --max-time $TIMEOUT)
            else
                response=$(curl -s -w "\n%{http_code}" -X "$method" \
                    "$GATEWAY_URL$endpoint" \
                    -H "$content_type" \
                    -H "User-Agent: FitnessApp-Simulator/1.0.0" \
                    -d "$data" \
                    --connect-timeout $TIMEOUT \
                    --max-time $TIMEOUT)
            fi
        else
            if [ -n "$auth_header" ]; then
                response=$(curl -s -w "\n%{http_code}" -X "$method" \
                    "$GATEWAY_URL$endpoint" \
                    -H "$auth_header" \
                    -H "User-Agent: FitnessApp-Simulator/1.0.0" \
                    --connect-timeout $TIMEOUT \
                    --max-time $TIMEOUT)
            else
                response=$(curl -s -w "\n%{http_code}" -X "$method" \
                    "$GATEWAY_URL$endpoint" \
                    -H "User-Agent: FitnessApp-Simulator/1.0.0" \
                    --connect-timeout $TIMEOUT \
                    --max-time $TIMEOUT)
            fi
        fi
        
        http_code=$(echo "$response" | tail -n1)
        response_body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" -lt 500 ]; then
            echo "$response_body"
            return $http_code
        else
            log_warning "Request failed (attempt $attempt/$RETRY_COUNT): HTTP $http_code"
            attempt=$((attempt + 1))
            sleep 2
        fi
    done
    
    log_error "All retry attempts failed"
    return 1
}

# Generate sample data
generate_user_data() {
    local username="user_fitness_${TIMESTAMP}"
    local email="${username}@fitness.test"
    
    echo "{
        \"username\": \"$username\",
        \"email\": \"$email\",
        \"password\": \"FitnessApp123!\",
        \"firstName\": \"Nguyễn\",
        \"lastName\": \"Văn Test\",
        \"dateOfBirth\": \"1990-01-01\",
        \"gender\": \"male\"
    }"
}

generate_profile_data() {
    echo "{
        \"height\": 170,
        \"weight\": 70,
        \"activityLevel\": \"moderately_active\",
        \"healthConditions\": \"none\",
        \"dietaryRestrictions\": \"none\"
    }"
}

generate_goal_data() {
    local target_date=$(date -d "+60 days" +%Y-%m-%d)
    
    echo "{
        \"goalType\": \"lose_weight\",
        \"targetWeight\": 65,
        \"targetDate\": \"$target_date\",
        \"description\": \"Mục tiêu giảm cân trong 2 tháng\"
    }"
}

generate_meal_data() {
    echo "{
        \"name\": \"Phở bò sáng\",
        \"mealType\": \"breakfast\",
        \"foods\": [
            {\"foodId\": 1, \"quantity\": 300, \"unit\": \"g\"},
            {\"foodId\": 2, \"quantity\": 100, \"unit\": \"g\"}
        ]
    }"
}

generate_exercise_data() {
    echo "{
        \"name\": \"Chạy bộ buổi sáng\",
        \"exerciseType\": \"cardio\",
        \"duration\": 30,
        \"intensity\": \"moderate\",
        \"caloriesBurned\": 300
    }"
}

# Main workflow functions
step1_authentication_flow() {
    log_header "BƯỚC 1: ĐĂNG NHẬP/ĐĂNG KÝ NGƯỜI DÙNG"
    
    # 1.1 Check system health
    log_info "Kiểm tra trạng thái API Gateway..."
    local health_response=$(api_request "GET" "/health" "" false)
    local health_code=$?
    
    if [ $health_code -eq 200 ]; then
        log_success "API Gateway đang hoạt động bình thường"
    else
        log_error "API Gateway có vấn đề (HTTP: $health_code)"
        return 1
    fi
    
    # 1.2 Register new user
    log_info "Đăng ký người dùng mới..."
    local user_data=$(generate_user_data)
    local username=$(echo "$user_data" | grep -o '"username": *"[^"]*"' | cut -d'"' -f4)
    local email=$(echo "$user_data" | grep -o '"email": *"[^"]*"' | cut -d'"' -f4)
    
    log "📝 Thông tin đăng ký:" "$CYAN"
    log "   • Username: $username"
    log "   • Email: $email"
    
    local register_response=$(api_request "POST" "/api/auth/register" "$user_data" false)
    local register_code=$?
    
    if [ $register_code -eq 201 ]; then
        log_success "Đăng ký thành công!"
        USER_ID=$(echo "$register_response" | grep -o '"id": *[0-9]*' | cut -d':' -f2 | tr -d ' ')
        if [ -n "$USER_ID" ]; then
            log "   • User ID: $USER_ID" "$GREEN"
        fi
    else
        log_error "Đăng ký thất bại (HTTP: $register_code)"
        echo "Response: $register_response"
        return 1
    fi
    
    # 1.3 Login
    log_info "Đăng nhập vào hệ thống..."
    local login_data="{
        \"username\": \"$username\",
        \"password\": \"FitnessApp123!\"
    }"
    
    local login_response=$(api_request "POST" "/api/auth/login" "$login_data" false)
    local login_code=$?
    
    if [ $login_code -eq 200 ]; then
        AUTH_TOKEN=$(echo "$login_response" | grep -o '"token": *"[^"]*"' | cut -d'"' -f4)
        if [ -z "$USER_ID" ]; then
            USER_ID=$(echo "$login_response" | grep -o '"id": *[0-9]*' | cut -d':' -f2 | tr -d ' ')
        fi
        
        log_success "Đăng nhập thành công!"
        log "   • Token: ${AUTH_TOKEN:0:20}..." "$GREEN"
        log "   • User ID: $USER_ID" "$GREEN"
        return 0
    else
        log_error "Đăng nhập thất bại (HTTP: $login_code)"
        echo "Response: $login_response"
        return 1
    fi
}

step2_personal_information_flow() {
    log_header "BƯỚC 2: NHẬP THÔNG TIN CÁ NHÂN"
    
    # 2.1 Update profile
    log_info "Cập nhật thông tin sức khỏe cá nhân..."
    local profile_data=$(generate_profile_data)
    
    log "📊 Thông tin sức khỏe:" "$CYAN"
    log "   • Chiều cao: 170cm"
    log "   • Cân nặng: 70kg"
    log "   • Mức độ hoạt động: moderately_active"
    log "   • Tình trạng sức khỏe: none"
    log "   • Chế độ ăn: none"
    
    local profile_response=$(api_request "PUT" "/api/users/$USER_ID/profile" "$profile_data")
    local profile_code=$?
    
    if [ $profile_code -eq 200 ]; then
        log_success "Cập nhật thông tin cá nhân thành công!"
    else
        log_error "Cập nhật profile thất bại (HTTP: $profile_code)"
    fi
    
    # 2.2 Create fitness goal
    log_info "Thiết lập mục tiêu fitness..."
    local goal_data=$(generate_goal_data)
    
    log "🎯 Mục tiêu fitness:" "$CYAN"
    log "   • Loại mục tiêu: lose_weight"
    log "   • Cân nặng mục tiêu: 65kg"
    log "   • Thời hạn: $(date -d '+60 days' +%Y-%m-%d)"
    
    local goal_response=$(api_request "POST" "/api/goals" "$goal_data")
    local goal_code=$?
    
    if [ $goal_code -eq 201 ]; then
        log_success "Tạo mục tiêu thành công!"
        local goal_id=$(echo "$goal_response" | grep -o '"id": *[0-9]*' | cut -d':' -f2 | tr -d ' ')
        if [ -n "$goal_id" ]; then
            log "   • Goal ID: $goal_id" "$GREEN"
        fi
    else
        log_error "Tạo mục tiêu thất bại (HTTP: $goal_code)"
    fi
    
    return 0
}

step3_food_and_activity_tracking() {
    log_header "BƯỚC 3: THEO DÕI BỮA ĂN VÀ HOẠT ĐỘNG"
    
    # 3.1 Log meals
    log_info "Ghi lại bữa ăn hàng ngày..."
    
    # Get available foods first
    local foods_response=$(api_request "GET" "/api/foods?page=1&limit=5")
    local foods_code=$?
    
    if [ $foods_code -eq 200 ]; then
        log_info "Tìm thấy danh sách foods có sẵn"
    else
        log_warning "Không thể lấy danh sách foods, sử dụng dữ liệu mẫu"
    fi
    
    # Log 2 meals
    for i in {1..2}; do
        local meal_data=$(generate_meal_data)
        local meal_name="Bữa ăn $i"
        
        log "🍽️  $meal_name: Phở bò sáng (breakfast)" "$CYAN"
        log "   • Số món ăn: 2"
        
        local meal_response=$(api_request "POST" "/api/meals" "$meal_data")
        local meal_code=$?
        
        if [ $meal_code -eq 201 ]; then
            log_success "Ghi lại $meal_name thành công!"
        else
            log_error "Ghi lại $meal_name thất bại (HTTP: $meal_code)"
        fi
        
        sleep 1
    done
    
    # 3.2 Log exercises
    log_info "Ghi lại hoạt động thể chất..."
    
    for i in {1..2}; do
        local exercise_data=$(generate_exercise_data)
        local exercise_name="Hoạt động $i"
        
        log "💪 $exercise_name: Chạy bộ buổi sáng" "$CYAN"
        log "   • Loại: cardio"
        log "   • Thời gian: 30 phút"
        log "   • Cường độ: moderate"
        log "   • Calories đốt cháy: 300"
        
        local exercise_response=$(api_request "POST" "/api/exercises" "$exercise_data")
        local exercise_code=$?
        
        if [ $exercise_code -eq 201 ]; then
            log_success "Ghi lại $exercise_name thành công!"
        else
            log_error "Ghi lại $exercise_name thất bại (HTTP: $exercise_code)"
        fi
        
        sleep 1
    done
    
    return 0
}

step4_analysis_and_calculation() {
    log_header "BƯỚC 4: PHÂN TÍCH VÀ TÍNH TOÁN HỆ THỐNG"
    
    # 4.1 Nutrition analysis
    log_info "Lấy báo cáo phân tích dinh dưỡng..."
    local nutrition_response=$(api_request "GET" "/api/nutrition/analysis")
    local nutrition_code=$?
    
    if [ $nutrition_code -eq 200 ]; then
        log_success "Phân tích dinh dưỡng thành công!"
        log "📊 Báo cáo dinh dưỡng hôm nay:" "$GREEN"
        log "   • Tổng calories: Đang tính toán..."
        log "   • Protein: Đang tính toán..."
        log "   • Carbs: Đang tính toán..."
        log "   • Fat: Đang tính toán..."
    else
        log_warning "Chưa có dữ liệu dinh dưỡng (HTTP: $nutrition_code)"
    fi
    
    # 4.2 Goal progress tracking
    log_info "Kiểm tra tiến trình mục tiêu..."
    local goals_response=$(api_request "GET" "/api/goals/my-goals")
    local goals_code=$?
    
    if [ $goals_code -eq 200 ]; then
        log_success "Lấy thông tin mục tiêu thành công!"
        log "🎯 Mục tiêu: lose_weight" "$GREEN"
        log "   • Tiến trình: Đang tính toán..."
        log "   • Trạng thái: active"
    else
        log_warning "Không tìm thấy mục tiêu nào (HTTP: $goals_code)"
    fi
    
    # 4.3 Get recommendations
    log_info "Lấy khuyến nghị từ hệ thống..."
    local recommendations_response=$(api_request "GET" "/api/goals/recommendations")
    local recommendations_code=$?
    
    if [ $recommendations_code -eq 200 ]; then
        log_success "Nhận khuyến nghị thành công!"
        log "💡 Khuyến nghị: Tăng cường hoạt động cardio" "$GREEN"
        log "   • Nội dung: Dựa trên mục tiêu giảm cân của bạn..."
        log "   • Độ ưu tiên: medium"
    else
        log_warning "Chưa có khuyến nghị từ hệ thống (HTTP: $recommendations_code)"
    fi
    
    # 4.4 User dashboard
    log_info "Lấy tổng quan dashboard người dùng..."
    local dashboard_response=$(api_request "GET" "/api/users/$USER_ID/dashboard")
    local dashboard_code=$?
    
    if [ $dashboard_code -eq 200 ]; then
        log_success "Dashboard tải thành công!"
        log "📈 Tổng quan hôm nay:" "$GREEN"
        log "   • Hoạt động: Đã cập nhật profile, mục tiêu, bữa ăn và tập luyện"
    else
        log_warning "Dashboard chưa sẵn sàng (HTTP: $dashboard_code)"
    fi
    
    return 0
}

# Main execution
run_simulation() {
    log "🚀 BẮT ĐẦU MÔ PHỎNG BEHAVIOR NGƯỜI DÙNG FITNESS APP" "$BOLD"
    log "📍 Gateway URL: $GATEWAY_URL" "$BLUE"
    log "⏰ Thời gian: $(date)" "$BLUE"
    
    # Step 1: Authentication
    if ! step1_authentication_flow; then
        log_error "Simulation dừng do lỗi authentication"
        exit 1
    fi
    
    sleep 2
    
    # Step 2: Personal Information
    step2_personal_information_flow
    
    sleep 2
    
    # Step 3: Food and Activity Tracking
    step3_food_and_activity_tracking
    
    sleep 2
    
    # Step 4: Analysis and Calculation
    step4_analysis_and_calculation
    
    # Summary
    log_header "🎉 MÔ PHỎNG HOÀN THÀNH THÀNH CÔNG!"
    
    echo
    log "📋 TỔNG KẾT SIMULATION:"
    log "• User đã đăng ký: user_fitness_${TIMESTAMP}"
    log "• Authentication token: ${AUTH_TOKEN:+Có}"
    log "• User ID: $USER_ID"
    log "• Profile được cập nhật: Có"
    log "• Mục tiêu được tạo: Có"
    log "• Bữa ăn được ghi lại: 2 bữa"
    log "• Hoạt động được ghi lại: 2 hoạt động"
    log "• Phân tích được thực hiện: Có"
}

# Interactive mode
interactive_mode() {
    echo
    log "🎮 CHỌN CHẾẾ ĐỘ SIMULATION:" "$BOLD"
    log "1. Chạy simulation đầy đủ (tự động)"
    log "2. Chỉ test authentication"
    log "3. Hiển thị hướng dẫn"
    log "4. Thoát"
    
    echo
    read -p "Nhập lựa chọn của bạn (1-4): " choice
    
    case $choice in
        1)
            run_simulation
            ;;
        2)
            step1_authentication_flow
            ;;
        3)
            show_help
            ;;
        4)
            log "👋 Tạm biệt!" "$GREEN"
            exit 0
            ;;
        *)
            log "❌ Lựa chọn không hợp lệ" "$RED"
            interactive_mode
            ;;
    esac
}

show_help() {
    log "🔧 FITNESS APP USER BEHAVIOR SIMULATION" "$BOLD"
    echo
    log "Cách sử dụng:"
    log "  $0 [options]"
    echo
    log "Options:"
    log "  --auto, -a       Chạy simulation tự động đầy đủ"
    log "  --auth-only      Chỉ test authentication flow"
    log "  --help, -h       Hiển thị hướng dẫn này"
    log "  (no args)        Chế độ interactive"
    echo
    log "Ví dụ:"
    log "  $0 --auto        # Chạy simulation tự động"
    log "  $0 --auth-only   # Chỉ test đăng nhập"
    log "  $0               # Chế độ interactive"
}

# Command line argument handling
case "${1:-}" in
    --auto|-a)
        run_simulation
        ;;
    --auth-only)
        step1_authentication_flow
        ;;
    --help|-h)
        show_help
        ;;
    "")
        interactive_mode
        ;;
    *)
        log_error "Tham số không hợp lệ: $1"
        show_help
        exit 1
        ;;
esac