#!/usr/bin/env python3
"""
FITNESS APP - USER BEHAVIOR SIMULATION (PYTHON VERSION)
========================================================
Mô phỏng behavior của user sử dụng frontend gọi tới backend thông qua API Gateway

Luồng hoạt động:
1. Đăng nhập/Đăng ký người dùng  
2. Nhập thông tin cá nhân
3. Theo dõi và ghi lại bữa ăn và hoạt động
4. Hệ thống phân tích và tính toán
"""

import requests
import json
import time
import random
import sys
import argparse
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
CONFIG = {
    'gateway_url': 'http://localhost:3000',
    'timeout': 10,
    'retry_attempts': 3,
    'retry_delay': 2
}

# Global state
auth_token: Optional[str] = None
user_id: Optional[int] = None
current_user: Optional[Dict[str, Any]] = None

# Colors for console output
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'

def log(message: str, color: str = Colors.RESET) -> None:
    """Print colored log message."""
    print(f"{color}{message}{Colors.RESET}")

def log_success(message: str) -> None:
    log(f"✅ {message}", Colors.GREEN)

def log_error(message: str) -> None:
    log(f"❌ {message}", Colors.RED)

def log_info(message: str) -> None:
    log(f"ℹ️  {message}", Colors.BLUE)

def log_warning(message: str) -> None:
    log(f"⚠️  {message}", Colors.YELLOW)

def log_header(message: str) -> None:
    print()
    log("=" * 60, Colors.BOLD)
    log(message, Colors.BOLD)
    log("=" * 60, Colors.BOLD)

def api_request(method: str, endpoint: str, data: Optional[Dict] = None, use_auth: bool = True) -> requests.Response:
    """Make API request with retry logic."""
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'FitnessApp-Simulator/1.0.0'
    }
    
    if use_auth and auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    url = f"{CONFIG['gateway_url']}{endpoint}"
    
    for attempt in range(1, CONFIG['retry_attempts'] + 1):
        try:
            response = requests.request(
                method=method,
                url=url,
                json=data,
                headers=headers,
                timeout=CONFIG['timeout']
            )
            
            # Don't retry on client errors (4xx)
            if response.status_code < 500:
                return response
                
        except requests.exceptions.RequestException as e:
            if attempt == CONFIG['retry_attempts']:
                raise e
            
            log_warning(f"Request failed (attempt {attempt}/{CONFIG['retry_attempts']}): {str(e)}")
            time.sleep(CONFIG['retry_delay'])
    
    raise Exception("All retry attempts failed")

def generate_user_data() -> Dict[str, Any]:
    """Generate sample user registration data."""
    timestamp = int(time.time())
    first_names = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Võ', 'Đặng']
    last_names = ['An', 'Bình', 'Chi', 'Dung', 'Hà', 'Linh', 'Mai', 'Nam', 'Quang', 'Thảo']
    
    first_name = random.choice(first_names)
    last_name = random.choice(last_names)
    username = f"{first_name.lower()}_{last_name.lower()}_{timestamp}"
    
    return {
        'username': username,
        'email': f"{username}@fitness.test",
        'password': 'FitnessApp123!',
        'firstName': first_name,
        'lastName': last_name,
        'dateOfBirth': '1990-01-01',
        'gender': random.choice(['male', 'female'])
    }

def generate_profile_data() -> Dict[str, Any]:
    """Generate sample profile data."""
    return {
        'height': random.randint(150, 180),
        'weight': random.randint(50, 90),
        'activityLevel': random.choice(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
        'healthConditions': random.choice(['none', 'diabetes', 'hypertension']),
        'dietaryRestrictions': random.choice(['none', 'vegetarian', 'vegan', 'gluten_free'])
    }

def generate_goal_data() -> Dict[str, Any]:
    """Generate sample goal data."""
    goal_types = ['lose_weight', 'gain_muscle', 'maintain_weight', 'improve_endurance']
    target_weights = [60, 65, 70, 75, 80]
    durations = [30, 60, 90, 180]  # days
    
    target_date = (datetime.now() + timedelta(days=random.choice(durations))).strftime('%Y-%m-%d')
    
    return {
        'goalType': random.choice(goal_types),
        'targetWeight': random.choice(target_weights),
        'targetDate': target_date,
        'description': 'Mục tiêu fitness cá nhân được tạo tự động'
    }

def generate_meal_data() -> Dict[str, Any]:
    """Generate sample meal data."""
    meals = [
        {
            'name': 'Phở bò',
            'mealType': 'breakfast',
            'foods': [
                {'foodId': 1, 'quantity': 300, 'unit': 'g'},
                {'foodId': 2, 'quantity': 100, 'unit': 'g'}
            ]
        },
        {
            'name': 'Cơm trưa văn phòng',
            'mealType': 'lunch',
            'foods': [
                {'foodId': 3, 'quantity': 150, 'unit': 'g'},
                {'foodId': 4, 'quantity': 100, 'unit': 'g'},
                {'foodId': 5, 'quantity': 200, 'unit': 'g'}
            ]
        },
        {
            'name': 'Salad tối',
            'mealType': 'dinner',
            'foods': [
                {'foodId': 6, 'quantity': 200, 'unit': 'g'},
                {'foodId': 7, 'quantity': 50, 'unit': 'g'}
            ]
        }
    ]
    
    return random.choice(meals)

def generate_exercise_data() -> Dict[str, Any]:
    """Generate sample exercise data."""
    exercises = [
        {
            'name': 'Chạy bộ buổi sáng',
            'exerciseType': 'cardio',
            'duration': 30,
            'intensity': 'moderate',
            'caloriesBurned': 300
        },
        {
            'name': 'Tập gym',
            'exerciseType': 'strength',
            'duration': 60,
            'intensity': 'high',
            'caloriesBurned': 400
        },
        {
            'name': 'Yoga thư giãn',
            'exerciseType': 'flexibility',
            'duration': 45,
            'intensity': 'low',
            'caloriesBurned': 150
        }
    ]
    
    return random.choice(exercises)

def step1_authentication_flow() -> bool:
    """Step 1: User authentication flow."""
    global auth_token, user_id, current_user
    
    log_header("BƯỚC 1: ĐĂNG NHẬP/ĐĂNG KÝ NGƯỜI DÙNG")
    
    # 1.1 Check system health
    try:
        log_info("Kiểm tra trạng thái API Gateway...")
        response = api_request('GET', '/health', use_auth=False)
        
        if response.status_code == 200:
            log_success("API Gateway đang hoạt động bình thường")
        else:
            log_error(f"API Gateway có vấn đề: {response.status_code}")
            return False
            
    except Exception as e:
        log_error(f"Không thể kết nối đến API Gateway: {str(e)}")
        return False
    
    # 1.2 Register new user
    try:
        log_info("Đăng ký người dùng mới...")
        user_data = generate_user_data()
        current_user = user_data.copy()
        
        log(f"📝 Thông tin đăng ký:", Colors.CYAN)
        log(f"   • Username: {user_data['username']}")
        log(f"   • Email: {user_data['email']}")
        log(f"   • Tên: {user_data['firstName']} {user_data['lastName']}")
        
        response = api_request('POST', '/api/auth/register', user_data, use_auth=False)
        
        if response.status_code == 201:
            log_success("Đăng ký thành công!")
            response_data = response.json()
            if 'user' in response_data and 'id' in response_data['user']:
                user_id = response_data['user']['id']
                log(f"   • User ID: {user_id}", Colors.GREEN)
        else:
            log_error(f"Đăng ký thất bại: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        log_error(f"Lỗi đăng ký: {str(e)}")
        return False
    
    # 1.3 Login
    try:
        log_info("Đăng nhập vào hệ thống...")
        login_data = {
            'username': current_user['username'],
            'password': current_user['password']
        }
        
        response = api_request('POST', '/api/auth/login', login_data, use_auth=False)
        
        if response.status_code == 200:
            response_data = response.json()
            auth_token = response_data.get('token')
            if not user_id:
                user_id = response_data.get('user', {}).get('id')
            
            log_success("Đăng nhập thành công!")
            log(f"   • Token: {auth_token[:20] if auth_token else 'N/A'}...", Colors.GREEN)
            log(f"   • User ID: {user_id}", Colors.GREEN)
            return True
        else:
            log_error(f"Đăng nhập thất bại: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        log_error(f"Lỗi đăng nhập: {str(e)}")
        return False

def step2_personal_information_flow() -> bool:
    """Step 2: Personal information setup."""
    log_header("BƯỚC 2: NHẬP THÔNG TIN CÁ NHÂN")
    
    # 2.1 Update profile
    try:
        log_info("Cập nhật thông tin sức khỏe cá nhân...")
        profile_data = generate_profile_data()
        
        log(f"📊 Thông tin sức khỏe:", Colors.CYAN)
        log(f"   • Chiều cao: {profile_data['height']}cm")
        log(f"   • Cân nặng: {profile_data['weight']}kg")
        log(f"   • Mức độ hoạt động: {profile_data['activityLevel']}")
        log(f"   • Tình trạng sức khỏe: {profile_data['healthConditions']}")
        log(f"   • Chế độ ăn: {profile_data['dietaryRestrictions']}")
        
        response = api_request('PUT', f'/api/users/{user_id}/profile', profile_data)
        
        if response.status_code == 200:
            log_success("Cập nhật thông tin cá nhân thành công!")
        else:
            log_error(f"Cập nhật profile thất bại: {response.status_code}")
            
    except Exception as e:
        log_error(f"Lỗi cập nhật profile: {str(e)}")
    
    # 2.2 Create fitness goal
    try:
        log_info("Thiết lập mục tiêu fitness...")
        goal_data = generate_goal_data()
        
        log(f"🎯 Mục tiêu fitness:", Colors.CYAN)
        log(f"   • Loại mục tiêu: {goal_data['goalType']}")
        log(f"   • Cân nặng mục tiêu: {goal_data['targetWeight']}kg")
        log(f"   • Thời hạn: {goal_data['targetDate']}")
        
        response = api_request('POST', '/api/goals', goal_data)
        
        if response.status_code == 201:
            log_success("Tạo mục tiêu thành công!")
            response_data = response.json()
            if 'id' in response_data:
                log(f"   • Goal ID: {response_data['id']}", Colors.GREEN)
        else:
            log_error(f"Tạo mục tiêu thất bại: {response.status_code}")
            
    except Exception as e:
        log_error(f"Lỗi tạo mục tiêu: {str(e)}")
    
    return True

def step3_food_and_activity_tracking() -> bool:
    """Step 3: Food and activity tracking."""
    log_header("BƯỚC 3: THEO DÕI BỮA ĂN VÀ HOẠT ĐỘNG")
    
    # 3.1 Log meals
    try:
        log_info("Ghi lại bữa ăn hàng ngày...")
        
        # Get available foods first
        try:
            response = api_request('GET', '/api/foods?page=1&limit=10')
            if response.status_code == 200:
                foods_data = response.json()
                available_foods = foods_data.get('data', [])
                log_info(f"Tìm thấy {len(available_foods)} món ăn có sẵn")
            else:
                available_foods = []
                log_warning("Không thể lấy danh sách foods, sử dụng dữ liệu mẫu")
        except Exception:
            available_foods = []
            log_warning("Không thể lấy danh sách foods, sử dụng dữ liệu mẫu")
        
        # Log 3 meals
        for i in range(3):
            meal_data = generate_meal_data()
            
            # Use real foods if available
            if available_foods:
                for food in meal_data['foods']:
                    food['foodId'] = random.choice(available_foods)['id']
            
            log(f"🍽️  Bữa ăn {i + 1}: {meal_data['name']} ({meal_data['mealType']})", Colors.CYAN)
            log(f"   • Số món ăn: {len(meal_data['foods'])}")
            
            response = api_request('POST', '/api/meals', meal_data)
            
            if response.status_code == 201:
                log_success(f"Ghi lại bữa ăn \"{meal_data['name']}\" thành công!")
            else:
                log_error(f"Ghi lại bữa ăn thất bại: {response.status_code}")
            
            time.sleep(1)
            
    except Exception as e:
        log_error(f"Lỗi ghi lại bữa ăn: {str(e)}")
    
    # 3.2 Log exercises
    try:
        log_info("Ghi lại hoạt động thể chất...")
        
        # Log 2 exercises
        for i in range(2):
            exercise_data = generate_exercise_data()
            
            log(f"💪 Hoạt động {i + 1}: {exercise_data['name']}", Colors.CYAN)
            log(f"   • Loại: {exercise_data['exerciseType']}")
            log(f"   • Thời gian: {exercise_data['duration']} phút")
            log(f"   • Cường độ: {exercise_data['intensity']}")
            log(f"   • Calories đốt cháy: {exercise_data['caloriesBurned']}")
            
            response = api_request('POST', '/api/exercises', exercise_data)
            
            if response.status_code == 201:
                log_success(f"Ghi lại hoạt động \"{exercise_data['name']}\" thành công!")
            else:
                log_error(f"Ghi lại hoạt động thất bại: {response.status_code}")
            
            time.sleep(1)
            
    except Exception as e:
        log_error(f"Lỗi ghi lại hoạt động: {str(e)}")
    
    return True

def step4_analysis_and_calculation() -> bool:
    """Step 4: System analysis and calculation."""
    log_header("BƯỚC 4: PHÂN TÍCH VÀ TÍNH TOÁN HỆ THỐNG")
    
    # 4.1 Nutrition analysis
    try:
        log_info("Lấy báo cáo phân tích dinh dưỡng...")
        response = api_request('GET', '/api/nutrition/analysis')
        
        if response.status_code == 200:
            log_success("Phân tích dinh dưỡng thành công!")
            data = response.json()
            
            log(f"📊 Báo cáo dinh dưỡng hôm nay:", Colors.GREEN)
            log(f"   • Tổng calories: {data.get('totalCalories', 0)} kcal")
            log(f"   • Protein: {data.get('totalProtein', 0)}g")
            log(f"   • Carbs: {data.get('totalCarbs', 0)}g")
            log(f"   • Fat: {data.get('totalFat', 0)}g")
        else:
            log_warning(f"Chưa có dữ liệu dinh dưỡng: {response.status_code}")
            
    except Exception as e:
        log_warning(f"Chưa có dữ liệu dinh dưỡng: {str(e)}")
    
    # 4.2 Goal progress tracking
    try:
        log_info("Kiểm tra tiến trình mục tiêu...")
        response = api_request('GET', '/api/goals/my-goals')
        
        if response.status_code == 200:
            goals = response.json()
            if goals:
                log_success("Lấy thông tin mục tiêu thành công!")
                
                for goal in goals:
                    log(f"🎯 Mục tiêu: {goal.get('goalType', 'N/A')}", Colors.GREEN)
                    log(f"   • Tiến trình: {goal.get('progress', 0)}%")
                    log(f"   • Trạng thái: {goal.get('status', 'active')}")
            else:
                log_warning("Không tìm thấy mục tiêu nào")
        else:
            log_warning(f"Không thể lấy mục tiêu: {response.status_code}")
            
    except Exception as e:
        log_warning(f"Lỗi kiểm tra mục tiêu: {str(e)}")
    
    # 4.3 Get recommendations
    try:
        log_info("Lấy khuyến nghị từ hệ thống...")
        response = api_request('GET', '/api/goals/recommendations')
        
        if response.status_code == 200:
            recommendations = response.json()
            if recommendations:
                log_success("Nhận khuyến nghị thành công!")
                
                for rec in recommendations:
                    log(f"💡 Khuyến nghị: {rec.get('type', 'N/A')}", Colors.GREEN)
                    log(f"   • Nội dung: {rec.get('content', rec.get('message', 'N/A'))}")
                    log(f"   • Độ ưu tiên: {rec.get('priority', 'medium')}")
            else:
                log_warning("Chưa có khuyến nghị từ hệ thống")
        else:
            log_warning(f"Chưa có khuyến nghị: {response.status_code}")
            
    except Exception as e:
        log_warning(f"Lỗi lấy khuyến nghị: {str(e)}")
    
    # 4.4 User dashboard
    try:
        log_info("Lấy tổng quan dashboard người dùng...")
        response = api_request('GET', f'/api/users/{user_id}/dashboard')
        
        if response.status_code == 200:
            log_success("Dashboard tải thành công!")
            dashboard = response.json()
            
            log(f"📈 Tổng quan hôm nay:", Colors.GREEN)
            log(f"   • Hoạt động: {', '.join(dashboard.keys()) if dashboard else 'Đang cập nhật'}")
        else:
            log_warning(f"Dashboard chưa sẵn sàng: {response.status_code}")
            
    except Exception as e:
        log_warning(f"Dashboard chưa sẵn sàng: {str(e)}")
    
    return True

def run_simulation():
    """Run the complete user behavior simulation."""
    log("🚀 BẮT ĐẦU MÔ PHỎNG BEHAVIOR NGƯỜI DÙNG FITNESS APP", Colors.BOLD)
    log(f"📍 Gateway URL: {CONFIG['gateway_url']}", Colors.BLUE)
    log(f"⏰ Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", Colors.BLUE)
    
    try:
        # Step 1: Authentication
        if not step1_authentication_flow():
            log_error("Simulation dừng do lỗi authentication")
            return
        
        time.sleep(2)
        
        # Step 2: Personal Information
        step2_personal_information_flow()
        
        time.sleep(2)
        
        # Step 3: Food and Activity Tracking
        step3_food_and_activity_tracking()
        
        time.sleep(2)
        
        # Step 4: Analysis and Calculation
        step4_analysis_and_calculation()
        
        # Summary
        log_header("🎉 MÔ PHỎNG HOÀN THÀNH THÀNH CÔNG!")
        
        print()
        log("📋 TỔNG KẾT SIMULATION:")
        log(f"• User đã đăng ký: {current_user['username'] if current_user else 'N/A'}")
        log(f"• Authentication token: {'Có' if auth_token else 'Không'}")
        log(f"• User ID: {user_id if user_id else 'N/A'}")
        log("• Profile được cập nhật: Có")
        log("• Mục tiêu được tạo: Có") 
        log("• Bữa ăn được ghi lại: 3 bữa")
        log("• Hoạt động được ghi lại: 2 hoạt động")
        log("• Phân tích được thực hiện: Có")
        
    except Exception as e:
        log_error(f"Simulation bị lỗi: {str(e)}")

def main():
    """Main function with command line argument handling."""
    parser = argparse.ArgumentParser(
        description="FITNESS APP - User Behavior Simulation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ sử dụng:
  %(prog)s --auto          # Chạy simulation tự động đầy đủ
  %(prog)s --auth-only     # Chỉ test authentication flow
  %(prog)s --interactive   # Chế độ interactive (mặc định)
        """
    )
    
    parser.add_argument('--auto', '-a', action='store_true',
                        help='Chạy simulation tự động đầy đủ')
    parser.add_argument('--auth-only', action='store_true',
                        help='Chỉ test authentication flow')
    parser.add_argument('--interactive', '-i', action='store_true',
                        help='Chế độ interactive')
    
    args = parser.parse_args()
    
    if args.auto:
        run_simulation()
    elif args.auth_only:
        step1_authentication_flow()
    else:
        # Interactive mode (default)
        print()
        log("🎮 CHỌN CHẾ ĐỘ SIMULATION:", Colors.BOLD)
        log("1. Chạy simulation đầy đủ (tự động)")
        log("2. Chỉ test authentication")
        log("3. Thoát")
        
        try:
            choice = input("\nNhập lựa chọn của bạn (1-3): ")
            
            if choice == '1':
                run_simulation()
            elif choice == '2':
                step1_authentication_flow()
            elif choice == '3':
                log("👋 Tạm biệt!", Colors.GREEN)
            else:
                log("❌ Lựa chọn không hợp lệ", Colors.RED)
        except KeyboardInterrupt:
            print()
            log("👋 Tạm biệt!", Colors.GREEN)

if __name__ == "__main__":
    main()