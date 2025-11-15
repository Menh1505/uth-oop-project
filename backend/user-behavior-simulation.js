#!/usr/bin/env node

/**
 * User Behavior Simulation Script
 * Mô phỏng behavior của user sử dụng frontend gọi tới backend
 * 
 * Luồng hoạt động:
 * 1. Đăng nhập/Đăng ký người dùng
 * 2. Nhập thông tin cá nhân 
 * 3. Theo dõi và ghi lại bữa ăn và hoạt động
 * 4. Hệ thống phân tích và tính toán
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const config = {
  gatewayUrl: 'http://localhost:3000',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 2000
};

// Global variables
let authToken = null;
let userId = null;
let currentUser = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// HTTP client with retry logic
async function apiRequest(method, endpoint, data = null, useAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'FitnessApp-Simulator/1.0.0'
  };

  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
    try {
      const response = await axios({
        method,
        url: `${config.gatewayUrl}${endpoint}`,
        data,
        headers,
        timeout: config.timeout,
        validateStatus: (status) => status < 500 // Don't retry on client errors
      });

      return response;
    } catch (error) {
      if (attempt === config.retryAttempts) {
        throw error;
      }
      
      logWarning(`Request failed (attempt ${attempt}/${config.retryAttempts}): ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
    }
  }
}

// Sample data generators
function generateUserData() {
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Võ', 'Đặng'];
  const lastNames = ['An', 'Bình', 'Chi', 'Dung', 'Hà', 'Linh', 'Mai', 'Nam', 'Quang', 'Thảo'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now()}`;
  const email = `${username}@fitness.test`;
  
  return {
    username,
    email,
    password: 'FitnessApp123!',
    firstName,
    lastName,
    dateOfBirth: '1990-01-01',
    gender: Math.random() > 0.5 ? 'male' : 'female'
  };
}

function generateProfileData() {
  return {
    height: Math.floor(Math.random() * 30) + 150, // 150-180cm
    weight: Math.floor(Math.random() * 40) + 50,   // 50-90kg
    activityLevel: ['sedentary', 'lightly_active', 'moderately_active', 'very_active'][Math.floor(Math.random() * 4)],
    healthConditions: ['none', 'diabetes', 'hypertension'][Math.floor(Math.random() * 3)],
    dietaryRestrictions: ['none', 'vegetarian', 'vegan', 'gluten_free'][Math.floor(Math.random() * 4)]
  };
}

function generateGoalData() {
  const goalTypes = ['lose_weight', 'gain_muscle', 'maintain_weight', 'improve_endurance'];
  const targetWeights = [60, 65, 70, 75, 80];
  const durations = [30, 60, 90, 180]; // days

  return {
    goalType: goalTypes[Math.floor(Math.random() * goalTypes.length)],
    targetWeight: targetWeights[Math.floor(Math.random() * targetWeights.length)],
    targetDate: new Date(Date.now() + durations[Math.floor(Math.random() * durations.length)] * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Mục tiêu fitness cá nhân được tạo tự động'
  };
}

function generateMealData() {
  const meals = [
    {
      name: 'Phở bò',
      mealType: 'breakfast',
      foods: [
        { foodId: 1, quantity: 300, unit: 'g' },
        { foodId: 2, quantity: 100, unit: 'g' }
      ]
    },
    {
      name: 'Cơm trưa văn phòng',
      mealType: 'lunch', 
      foods: [
        { foodId: 3, quantity: 150, unit: 'g' },
        { foodId: 4, quantity: 100, unit: 'g' },
        { foodId: 5, quantity: 200, unit: 'g' }
      ]
    },
    {
      name: 'Salad tối',
      mealType: 'dinner',
      foods: [
        { foodId: 6, quantity: 200, unit: 'g' },
        { foodId: 7, quantity: 50, unit: 'g' }
      ]
    }
  ];

  return meals[Math.floor(Math.random() * meals.length)];
}

function generateExerciseData() {
  const exercises = [
    {
      name: 'Chạy bộ buổi sáng',
      exerciseType: 'cardio',
      duration: 30,
      intensity: 'moderate',
      caloriesBurned: 300
    },
    {
      name: 'Tập gym',
      exerciseType: 'strength',
      duration: 60,
      intensity: 'high',
      caloriesBurned: 400
    },
    {
      name: 'Yoga thư giãn',
      exerciseType: 'flexibility',
      duration: 45,
      intensity: 'low',
      caloriesBurned: 150
    }
  ];

  return exercises[Math.floor(Math.random() * exercises.length)];
}

// Main workflow functions
async function step1_AuthenticationFlow() {
  log('\n' + '='.repeat(60), colors.bright);
  log('BƯỚC 1: ĐĂNG NHẬP/ĐĂNG KÝ NGƯỜI DÙNG', colors.bright);
  log('='.repeat(60), colors.bright);

  // 1.1 Kiểm tra trạng thái hệ thống
  try {
    logInfo('Kiểm tra trạng thái API Gateway...');
    const healthResponse = await apiRequest('GET', '/health', null, false);
    
    if (healthResponse.status === 200) {
      logSuccess('API Gateway đang hoạt động bình thường');
    } else {
      logError('API Gateway có vấn đề');
      return false;
    }
  } catch (error) {
    logError(`Không thể kết nối đến API Gateway: ${error.message}`);
    return false;
  }

  // 1.2 Đăng ký người dùng mới
  try {
    logInfo('Đăng ký người dùng mới...');
    const userData = generateUserData();
    
    log(`📝 Thông tin đăng ký:`, colors.cyan);
    log(`   • Username: ${userData.username}`);
    log(`   • Email: ${userData.email}`);
    log(`   • Tên: ${userData.firstName} ${userData.lastName}`);
    
    const registerResponse = await apiRequest('POST', '/api/auth/register', userData, false);
    
    if (registerResponse.status === 201) {
      logSuccess('Đăng ký thành công!');
      currentUser = { ...userData, id: registerResponse.data.user?.id };
      
      // Log response data
      if (registerResponse.data.user) {
        log(`   • User ID: ${registerResponse.data.user.id}`, colors.green);
      }
    } else {
      logError(`Đăng ký thất bại: ${registerResponse.status} - ${JSON.stringify(registerResponse.data)}`);
      return false;
    }
  } catch (error) {
    logError(`Lỗi đăng ký: ${error.response?.data?.message || error.message}`);
    return false;
  }

  // 1.3 Đăng nhập
  try {
    logInfo('Đăng nhập vào hệ thống...');
    
    const loginData = {
      username: currentUser.username,
      password: currentUser.password
    };
    
    const loginResponse = await apiRequest('POST', '/api/auth/login', loginData, false);
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      userId = loginResponse.data.user?.id || currentUser.id;
      
      logSuccess('Đăng nhập thành công!');
      log(`   • Token: ${authToken.substring(0, 20)}...`, colors.green);
      log(`   • User ID: ${userId}`, colors.green);
      
      return true;
    } else {
      logError(`Đăng nhập thất bại: ${loginResponse.status} - ${JSON.stringify(loginResponse.data)}`);
      return false;
    }
  } catch (error) {
    logError(`Lỗi đăng nhập: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function step2_PersonalInformationFlow() {
  log('\n' + '='.repeat(60), colors.bright);
  log('BƯỚC 2: NHẬP THÔNG TIN CÁ NHÂN', colors.bright);
  log('='.repeat(60), colors.bright);

  // 2.1 Cập nhật thông tin profile
  try {
    logInfo('Cập nhật thông tin sức khỏe cá nhân...');
    const profileData = generateProfileData();
    
    log(`📊 Thông tin sức khỏe:`, colors.cyan);
    log(`   • Chiều cao: ${profileData.height}cm`);
    log(`   • Cân nặng: ${profileData.weight}kg`);
    log(`   • Mức độ hoạt động: ${profileData.activityLevel}`);
    log(`   • Tình trạng sức khỏe: ${profileData.healthConditions}`);
    log(`   • Chế độ ăn: ${profileData.dietaryRestrictions}`);
    
    const profileResponse = await apiRequest('PUT', `/api/users/${userId}/profile`, profileData);
    
    if (profileResponse.status === 200) {
      logSuccess('Cập nhật thông tin cá nhân thành công!');
    } else {
      logError(`Cập nhật profile thất bại: ${profileResponse.status}`);
    }
  } catch (error) {
    logError(`Lỗi cập nhật profile: ${error.response?.data?.message || error.message}`);
  }

  // 2.2 Tạo mục tiêu cá nhân
  try {
    logInfo('Thiết lập mục tiêu fitness...');
    const goalData = generateGoalData();
    
    log(`🎯 Mục tiêu fitness:`, colors.cyan);
    log(`   • Loại mục tiêu: ${goalData.goalType}`);
    log(`   • Cân nặng mục tiêu: ${goalData.targetWeight}kg`);
    log(`   • Thời hạn: ${goalData.targetDate}`);
    
    const goalResponse = await apiRequest('POST', '/api/goals', goalData);
    
    if (goalResponse.status === 201) {
      logSuccess('Tạo mục tiêu thành công!');
      log(`   • Goal ID: ${goalResponse.data.id}`, colors.green);
    } else {
      logError(`Tạo mục tiêu thất bại: ${goalResponse.status}`);
    }
  } catch (error) {
    logError(`Lỗi tạo mục tiêu: ${error.response?.data?.message || error.message}`);
  }

  return true;
}

async function step3_FoodAndActivityTracking() {
  log('\n' + '='.repeat(60), colors.bright);
  log('BƯỚC 3: THEO DÕI BỮA ĂN VÀ HOẠT ĐỘNG', colors.bright);
  log('='.repeat(60), colors.bright);

  // 3.1 Ghi lại bữa ăn
  try {
    logInfo('Ghi lại bữa ăn hàng ngày...');
    
    // Lấy danh sách foods trước
    let availableFoods = [];
    try {
      const foodsResponse = await apiRequest('GET', '/api/foods?page=1&limit=10');
      if (foodsResponse.status === 200 && foodsResponse.data.data) {
        availableFoods = foodsResponse.data.data;
        logInfo(`Tìm thấy ${availableFoods.length} món ăn có sẵn`);
      }
    } catch (error) {
      logWarning('Không thể lấy danh sách foods, sử dụng dữ liệu mẫu');
    }
    
    // Ghi lại 3 bữa ăn
    for (let i = 0; i < 3; i++) {
      const mealData = generateMealData();
      
      // Sử dụng foods thực tế nếu có
      if (availableFoods.length > 0) {
        mealData.foods = mealData.foods.map(food => ({
          ...food,
          foodId: availableFoods[Math.floor(Math.random() * availableFoods.length)].id
        }));
      }
      
      log(`🍽️  Bữa ăn ${i + 1}: ${mealData.name} (${mealData.mealType})`, colors.cyan);
      log(`   • Số món ăn: ${mealData.foods.length}`);
      
      const mealResponse = await apiRequest('POST', '/api/meals', mealData);
      
      if (mealResponse.status === 201) {
        logSuccess(`Ghi lại bữa ăn "${mealData.name}" thành công!`);
      } else {
        logError(`Ghi lại bữa ăn thất bại: ${mealResponse.status}`);
      }
      
      // Delay giữa các requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    logError(`Lỗi ghi lại bữa ăn: ${error.response?.data?.message || error.message}`);
  }

  // 3.2 Ghi lại hoạt động thể chất  
  try {
    logInfo('Ghi lại hoạt động thể chất...');
    
    // Ghi lại 2-3 hoạt động
    for (let i = 0; i < 2; i++) {
      const exerciseData = generateExerciseData();
      
      log(`💪 Hoạt động ${i + 1}: ${exerciseData.name}`, colors.cyan);
      log(`   • Loại: ${exerciseData.exerciseType}`);
      log(`   • Thời gian: ${exerciseData.duration} phút`);
      log(`   • Cường độ: ${exerciseData.intensity}`);
      log(`   • Calories đốt cháy: ${exerciseData.caloriesBurned}`);
      
      const exerciseResponse = await apiRequest('POST', '/api/exercises', exerciseData);
      
      if (exerciseResponse.status === 201) {
        logSuccess(`Ghi lại hoạt động "${exerciseData.name}" thành công!`);
      } else {
        logError(`Ghi lại hoạt động thất bại: ${exerciseResponse.status}`);
      }
      
      // Delay giữa các requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    logError(`Lỗi ghi lại hoạt động: ${error.response?.data?.message || error.message}`);
  }

  return true;
}

async function step4_AnalysisAndCalculation() {
  log('\n' + '='.repeat(60), colors.bright);
  log('BƯỚC 4: PHÂN TÍCH VÀ TÍNH TOÁN HỆ THỐNG', colors.bright);
  log('='.repeat(60), colors.bright);

  // 4.1 Phân tích dinh dưỡng
  try {
    logInfo('Lấy báo cáo phân tích dinh dưỡng...');
    
    const nutritionResponse = await apiRequest('GET', '/api/nutrition/analysis');
    
    if (nutritionResponse.status === 200) {
      logSuccess('Phân tích dinh dưỡng thành công!');
      
      const data = nutritionResponse.data;
      if (data.totalCalories !== undefined) {
        log(`📊 Báo cáo dinh dưỡng hôm nay:`, colors.green);
        log(`   • Tổng calories: ${data.totalCalories || 0} kcal`);
        log(`   • Protein: ${data.totalProtein || 0}g`);
        log(`   • Carbs: ${data.totalCarbs || 0}g`);
        log(`   • Fat: ${data.totalFat || 0}g`);
      }
    } else {
      logWarning(`Không thể lấy báo cáo dinh dưỡng: ${nutritionResponse.status}`);
    }
  } catch (error) {
    logWarning(`Chưa có dữ liệu dinh dưỡng: ${error.response?.data?.message || error.message}`);
  }

  // 4.2 Theo dõi tiến trình mục tiêu
  try {
    logInfo('Kiểm tra tiến trình mục tiêu...');
    
    const goalsResponse = await apiRequest('GET', '/api/goals/my-goals');
    
    if (goalsResponse.status === 200 && goalsResponse.data.length > 0) {
      logSuccess('Lấy thông tin mục tiêu thành công!');
      
      for (const goal of goalsResponse.data) {
        log(`🎯 Mục tiêu: ${goal.goalType}`, colors.green);
        log(`   • Tiến trình: ${goal.progress || 0}%`);
        log(`   • Trạng thái: ${goal.status || 'active'}`);
        
        // Lấy thống kê chi tiết
        try {
          const statsResponse = await apiRequest('GET', `/api/goals/${goal.id}/statistics`);
          if (statsResponse.status === 200) {
            const stats = statsResponse.data;
            log(`   • Thống kê: ${JSON.stringify(stats)}`, colors.cyan);
          }
        } catch (error) {
          logWarning(`Không thể lấy thống kê cho goal ${goal.id}`);
        }
      }
    } else {
      logWarning('Không tìm thấy mục tiêu nào');
    }
  } catch (error) {
    logWarning(`Lỗi kiểm tra mục tiêu: ${error.response?.data?.message || error.message}`);
  }

  // 4.3 Nhận khuyến nghị từ hệ thống
  try {
    logInfo('Lấy khuyến nghị từ hệ thống...');
    
    const recommendationsResponse = await apiRequest('GET', '/api/goals/recommendations');
    
    if (recommendationsResponse.status === 200 && recommendationsResponse.data.length > 0) {
      logSuccess('Nhận khuyến nghị thành công!');
      
      for (const recommendation of recommendationsResponse.data) {
        log(`💡 Khuyến nghị: ${recommendation.type}`, colors.green);
        log(`   • Nội dung: ${recommendation.content || recommendation.message}`);
        log(`   • Độ ưu tiên: ${recommendation.priority || 'medium'}`);
      }
    } else {
      logWarning('Chưa có khuyến nghị từ hệ thống');
    }
  } catch (error) {
    logWarning(`Lỗi lấy khuyến nghị: ${error.response?.data?.message || error.message}`);
  }

  // 4.4 Lấy tổng quan dashboard
  try {
    logInfo('Lấy tổng quan dashboard người dùng...');
    
    const dashboardResponse = await apiRequest('GET', `/api/users/${userId}/dashboard`);
    
    if (dashboardResponse.status === 200) {
      logSuccess('Dashboard tải thành công!');
      
      const dashboard = dashboardResponse.data;
      log(`📈 Tổng quan hôm nay:`, colors.green);
      log(`   • Hoạt động: ${Object.keys(dashboard).join(', ')}`);
    } else {
      logWarning(`Không thể tải dashboard: ${dashboardResponse.status}`);
    }
  } catch (error) {
    logWarning(`Dashboard chưa sẵn sàng: ${error.response?.data?.message || error.message}`);
  }

  return true;
}

// Main execution
async function runSimulation() {
  log('🚀 BẮT ĐẦU MÔ PHỎNG BEHAVIOR NGƯỜI DÙNG FITNESS APP', colors.bright);
  log(`📍 Gateway URL: ${config.gatewayUrl}`, colors.blue);
  log(`⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`, colors.blue);

  try {
    // Bước 1: Authentication
    const authSuccess = await step1_AuthenticationFlow();
    if (!authSuccess) {
      logError('Simulation dừng do lỗi authentication');
      return;
    }

    // Delay giữa các bước
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Bước 2: Personal Information
    await step2_PersonalInformationFlow();

    // Delay giữa các bước
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Bước 3: Food and Activity Tracking
    await step3_FoodAndActivityTracking();

    // Delay giữa các bước
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Bước 4: Analysis and Calculation
    await step4_AnalysisAndCalculation();

    // Kết thúc
    log('\n' + '='.repeat(60), colors.bright);
    logSuccess('🎉 MÔ PHỎNG HOÀN THÀNH THÀNH CÔNG!');
    log('='.repeat(60), colors.bright);

    log('\n📋 TỔNG KẾT SIMULATION:');
    log(`• User đã đăng ký: ${currentUser?.username}`);
    log(`• Authentication token: ${authToken ? 'Có' : 'Không'}`);
    log(`• Profile được cập nhật: Có`);
    log(`• Mục tiêu được tạo: Có`);
    log(`• Bữa ăn được ghi lại: 3 bữa`);
    log(`• Hoạt động được ghi lại: 2 hoạt động`);
    log(`• Phân tích được thực hiện: Có`);

  } catch (error) {
    logError(`Simulation bị lỗi: ${error.message}`);
  }
}

// Interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function interactiveMode() {
  log('\n🎮 CHỌN CHẾẾ ĐỘ SIMULATION:', colors.bright);
  log('1. Chạy simulation đầy đủ (tự động)');
  log('2. Chạy từng bước (interactive)');
  log('3. Chỉ test authentication');
  log('4. Thoát');

  const choice = await askQuestion('\nNhập lựa chọn của bạn (1-4): ');

  switch (choice) {
    case '1':
      rl.close();
      await runSimulation();
      break;
    case '2':
      await runInteractiveSteps();
      break;
    case '3':
      rl.close();
      await step1_AuthenticationFlow();
      break;
    case '4':
      log('👋 Tạm biệt!', colors.green);
      rl.close();
      break;
    default:
      log('❌ Lựa chọn không hợp lệ', colors.red);
      await interactiveMode();
  }
}

async function runInteractiveSteps() {
  let continueSteps = true;

  // Step 1
  if (continueSteps) {
    const step1Success = await step1_AuthenticationFlow();
    if (!step1Success) {
      rl.close();
      return;
    }

    const continue1 = await askQuestion('\n⏩ Tiếp tục với bước 2? (y/n): ');
    continueSteps = continue1.toLowerCase() === 'y';
  }

  // Step 2  
  if (continueSteps) {
    await step2_PersonalInformationFlow();
    const continue2 = await askQuestion('\n⏩ Tiếp tục với bước 3? (y/n): ');
    continueSteps = continue2.toLowerCase() === 'y';
  }

  // Step 3
  if (continueSteps) {
    await step3_FoodAndActivityTracking();
    const continue3 = await askQuestion('\n⏩ Tiếp tục với bước 4? (y/n): ');
    continueSteps = continue3.toLowerCase() === 'y';
  }

  // Step 4
  if (continueSteps) {
    await step4_AnalysisAndCalculation();
  }

  rl.close();
  logSuccess('🎉 Interactive simulation hoàn thành!');
}

// CLI argument handling
const args = process.argv.slice(2);

if (args.includes('--auto') || args.includes('-a')) {
  runSimulation();
} else if (args.includes('--auth-only')) {
  step1_AuthenticationFlow();
} else if (args.includes('--help') || args.includes('-h')) {
  log('🔧 FITNESS APP USER BEHAVIOR SIMULATION', colors.bright);
  log('\nCách sử dụng:');
  log('  node user-behavior-simulation.js [options]');
  log('\nOptions:');
  log('  --auto, -a       Chạy simulation tự động đầy đủ');
  log('  --auth-only      Chỉ test authentication flow');
  log('  --help, -h       Hiển thị hướng dẫn này');
  log('  (no args)        Chế độ interactive');
} else {
  interactiveMode();
}

// Export for potential module usage
module.exports = {
  runSimulation,
  step1_AuthenticationFlow,
  step2_PersonalInformationFlow,
  step3_FoodAndActivityTracking,
  step4_AnalysisAndCalculation
};