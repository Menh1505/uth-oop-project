# User Behavior Simulation Scripts

Bộ scripts mô phỏng behavior của user sử dụng frontend gọi tới backend thông qua API Gateway.

## 📋 Mô tả

Scripts này mô phỏng toàn bộ luồng hoạt động của người dùng trong ứng dụng Fitness App:

1. **Đăng nhập/Đăng ký người dùng**: Người dùng tạo tài khoản và đăng nhập vào hệ thống
2. **Nhập thông tin cá nhân**: Cập nhật profile sức khỏe và thiết lập mục tiêu fitness
3. **Theo dõi và ghi lại bữa ăn và hoạt động**: Ghi nhận bữa ăn hàng ngày và hoạt động thể chất  
4. **Hệ thống phân tích và tính toán**: Lấy báo cáo dinh dưỡng và khuyến nghị từ hệ thống

## 🔧 Yêu cầu hệ thống

### Đối với JavaScript/Node.js version:
```bash
# Cài đặt dependencies
npm install axios readline
```

### Đối với Python version:
```bash
# Cài đặt dependencies  
pip install requests
```

### Đối với Bash version:
```bash
# Chỉ cần curl (thường có sẵn trên Linux/macOS)
which curl
```

## 🚀 Cách sử dụng

### 1. JavaScript/Node.js Version (Khuyến nghị)

#### Chạy tự động (đầy đủ):
```bash
node user-behavior-simulation.js --auto
```

#### Chạy chế độ interactive:
```bash
node user-behavior-simulation.js
```

#### Chỉ test authentication:
```bash
node user-behavior-simulation.js --auth-only
```

#### Hiển thị help:
```bash
node user-behavior-simulation.js --help
```

### 2. Python Version

#### Chạy tự động (đầy đủ):
```bash
python3 user-behavior-simulation.py --auto
```

#### Chạy chế độ interactive:
```bash
python3 user-behavior-simulation.py
```

#### Chỉ test authentication:
```bash
python3 user-behavior-simulation.py --auth-only
```

### 3. Bash/Curl Version

#### Chạy tự động (đầy đủ):
```bash
chmod +x user-behavior-simulation.sh
./user-behavior-simulation.sh --auto
```

#### Chạy chế độ interactive:
```bash
./user-behavior-simulation.sh
```

#### Chỉ test authentication:
```bash
./user-behavior-simulation.sh --auth-only
```

## 📊 Kết quả mong đợi

### Khi chạy thành công, bạn sẽ thấy:

```
🚀 BẮT ĐẦU MÔ PHỎNG BEHAVIOR NGƯỜI DÙNG FITNESS APP
📍 Gateway URL: http://localhost:3000
⏰ Thời gian: 2025-11-16 15:30:00

============================================================
BƯỚC 1: ĐĂNG NHẬP/ĐĂNG KÝ NGƯỜI DÙNG
============================================================
ℹ️  Kiểm tra trạng thái API Gateway...
✅ API Gateway đang hoạt động bình thường
ℹ️  Đăng ký người dùng mới...
📝 Thông tin đăng ký:
   • Username: nguyen_van_1731747000
   • Email: nguyen_van_1731747000@fitness.test
   • Tên: Nguyễn Văn Test
✅ Đăng ký thành công!
   • User ID: 123
ℹ️  Đăng nhập vào hệ thống...
✅ Đăng nhập thành công!
   • Token: eyJhbGciOiJIUzI1NiI...
   • User ID: 123

============================================================
BƯỚC 2: NHẬP THÔNG TIN CÁ NHÂN
============================================================
ℹ️  Cập nhật thông tin sức khỏe cá nhân...
📊 Thông tin sức khỏe:
   • Chiều cao: 170cm
   • Cân nặng: 70kg
   • Mức độ hoạt động: moderately_active
   • Tình trạng sức khỏe: none
   • Chế độ ăn: none
✅ Cập nhật thông tin cá nhân thành công!
ℹ️  Thiết lập mục tiêu fitness...
🎯 Mục tiêu fitness:
   • Loại mục tiêu: lose_weight
   • Cân nặng mục tiêu: 65kg
   • Thời hạn: 2026-01-15
✅ Tạo mục tiêu thành công!
   • Goal ID: 456

============================================================
BƯỚC 3: THEO DÕI BỮA ĂN VÀ HOẠT ĐỘNG
============================================================
ℹ️  Ghi lại bữa ăn hàng ngày...
ℹ️  Tìm thấy 10 món ăn có sẵn
🍽️  Bữa ăn 1: Phở bò (breakfast)
   • Số món ăn: 2
✅ Ghi lại bữa ăn "Phở bò" thành công!
...
ℹ️  Ghi lại hoạt động thể chất...
💪 Hoạt động 1: Chạy bộ buổi sáng
   • Loại: cardio
   • Thời gian: 30 phút
   • Cường độ: moderate
   • Calories đốt cháy: 300
✅ Ghi lại hoạt động "Chạy bộ buổi sáng" thành công!
...

============================================================
BƯỚC 4: PHÂN TÍCH VÀ TÍNH TOÁN HỆ THỐNG
============================================================
ℹ️  Lấy báo cáo phân tích dinh dưỡng...
✅ Phân tích dinh dưỡng thành công!
📊 Báo cáo dinh dưỡng hôm nay:
   • Tổng calories: 1200 kcal
   • Protein: 50g
   • Carbs: 150g
   • Fat: 40g
...

============================================================
🎉 MÔ PHỎNG HOÀN THÀNH THÀNH CÔNG!
============================================================

📋 TỔNG KẾT SIMULATION:
• User đã đăng ký: nguyen_van_1731747000
• Authentication token: Có
• User ID: 123
• Profile được cập nhật: Có
• Mục tiêu được tạo: Có
• Bữa ăn được ghi lại: 3 bữa
• Hoạt động được ghi lại: 2 hoạt động
• Phân tích được thực hiện: Có
```

## ⚙️ Cấu hình

### Thay đổi Gateway URL:
Mặc định script kết nối tới `http://localhost:3000`. Để thay đổi:

**JavaScript:**
```javascript
const config = {
  gatewayUrl: 'http://your-api-gateway:port',
  // ...
};
```

**Python:**
```python
CONFIG = {
    'gateway_url': 'http://your-api-gateway:port',
    # ...
}
```

**Bash:**
```bash
GATEWAY_URL="http://your-api-gateway:port"
```

### Thay đổi số lượng retry và timeout:

**JavaScript:**
```javascript
const config = {
  timeout: 10000,        // 10 seconds
  retryAttempts: 3,
  retryDelay: 2000       // 2 seconds
};
```

## 🔍 Troubleshooting

### 1. Connection Error
```
❌ Không thể kết nối đến API Gateway: ECONNREFUSED
```
**Giải pháp**: Đảm bảo API Gateway đang chạy tại `http://localhost:3000`

### 2. Authentication Failed
```
❌ Đăng nhập thất bại: 401 - Unauthorized
```
**Giải pháp**: Kiểm tra auth-service có đang hoạt động không

### 3. Service Unavailable
```
❌ Ghi lại bữa ăn thất bại: 503 - Service Unavailable  
```
**Giải pháp**: Kiểm tra các microservices (meal-service, goal-service, etc.) có đang chạy không

### 4. Database Connection Error
```
❌ Cập nhật profile thất bại: 500 - Internal Server Error
```
**Giải pháp**: Kiểm tra PostgreSQL database có đang chạy và migration đã được apply chưa

## 📝 Logs và Debugging

### Bật debug mode (JavaScript):
```javascript
// Thêm vào config
const config = {
  debug: true,
  // ...
};
```

### Xem network requests (curl):
```bash
# Thêm -v để xem chi tiết requests
curl -v -X GET http://localhost:3000/health
```

## 🧪 Test Cases

Scripts bao gồm các test cases sau:

1. ✅ **Health Check**: Kiểm tra API Gateway
2. ✅ **User Registration**: Đăng ký user mới
3. ✅ **User Login**: Đăng nhập và lấy JWT token
4. ✅ **Profile Update**: Cập nhật thông tin sức khỏe
5. ✅ **Goal Creation**: Tạo mục tiêu fitness
6. ✅ **Meal Logging**: Ghi lại bữa ăn
7. ✅ **Exercise Logging**: Ghi lại hoạt động thể chất
8. ✅ **Nutrition Analysis**: Phân tích dinh dưỡng
9. ✅ **Goal Progress**: Theo dõi tiến trình mục tiêu
10. ✅ **Recommendations**: Lấy khuyến nghị từ hệ thống

## 📚 API Endpoints được test

| Endpoint | Method | Service | Description |
|----------|--------|---------|-------------|
| `/health` | GET | Gateway | Health check |
| `/api/auth/register` | POST | Auth | Đăng ký user |
| `/api/auth/login` | POST | Auth | Đăng nhập |
| `/api/users/{id}/profile` | PUT | User | Cập nhật profile |
| `/api/goals` | POST | Goal | Tạo mục tiêu |
| `/api/goals/my-goals` | GET | Goal | Lấy mục tiêu của user |
| `/api/goals/recommendations` | GET | Goal | Lấy khuyến nghị |
| `/api/meals` | POST | Meal | Ghi lại bữa ăn |
| `/api/foods` | GET | Meal | Lấy danh sách foods |
| `/api/nutrition/analysis` | GET | Meal | Phân tích dinh dưỡng |
| `/api/exercises` | POST | Exercise | Ghi lại hoạt động |
| `/api/users/{id}/dashboard` | GET | User | Dashboard tổng quan |

## 🤝 Đóng góp

Để cải thiện scripts:

1. Fork repository
2. Tạo feature branch
3. Thêm test cases mới hoặc cải thiện hiện tại
4. Tạo Pull Request

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.