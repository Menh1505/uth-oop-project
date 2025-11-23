# Meal Service

Dịch vụ quản lý bữa ăn cho hệ thống fitness/health tracker.

## Chức năng

### Meal Management (Quản lý bữa ăn)
- ✅ Tạo, sửa, xóa bữa ăn
- ✅ Quản lý các loại bữa ăn: Breakfast, Lunch, Dinner, Snack, Pre-workout, Post-workout
- ✅ Theo dõi thời gian và ngày tháng của bữa ăn
- ✅ Ghi chú cho từng bữa ăn

### Food Management (Quản lý thực phẩm)
- ✅ Tạo, sửa, xóa thông tin thực phẩm
- ✅ Tìm kiếm thực phẩm theo nhiều tiêu chí
- ✅ Quản lý thông tin dinh dưỡng chi tiết
- ✅ Hỗ trợ barcode scanning
- ✅ Phân loại theo categories
- ✅ Hỗ trợ dietary restrictions (vegetarian, vegan, gluten-free)
- ✅ Quản lý allergens

### Nutrition Analysis (Phân tích dinh dưỡng)
- ✅ Tính toán dinh dưỡng theo từng bữa ăn
- ✅ Tổng hợp dinh dưỡng theo ngày
- ✅ Báo cáo dinh dưỡng theo khoảng thời gian
- ✅ Phân tích macro/micro nutrients
- ✅ Tính % phân bố calo từ protein, carbs, fat
- ✅ Theo dõi vitamins và minerals

### Meal Recommendations (Đề xuất bữa ăn)
- ✅ Đề xuất bữa ăn phù hợp với mục tiêu
- ✅ Lọc theo dietary restrictions
- ✅ Tránh allergens
- ✅ Tính toán calories và macros phù hợp

## API Endpoints

### Meal Management
```
POST   /meals                           - Tạo bữa ăn mới
GET    /meals/:mealId                   - Lấy thông tin bữa ăn
PUT    /meals/:mealId                   - Cập nhật bữa ăn
DELETE /meals/:mealId                   - Xóa bữa ăn
GET    /meals/date/:date                - Lấy bữa ăn theo ngày
GET    /meals/range/:start/:end         - Lấy bữa ăn theo khoảng thời gian
```

### Meal Foods Management
```
POST   /meals/:mealId/foods             - Thêm thực phẩm vào bữa ăn
PUT    /meals/foods/:mealFoodId         - Cập nhật thực phẩm trong bữa ăn
DELETE /meals/foods/:mealFoodId         - Xóa thực phẩm khỏi bữa ăn
```

### Food Management
```
GET    /foods                          - Tìm kiếm thực phẩm
POST   /foods                          - Tạo thực phẩm mới
GET    /foods/:foodId                  - Lấy thông tin thực phẩm
PUT    /foods/:foodId                  - Cập nhật thực phẩm
DELETE /foods/:foodId                  - Xóa thực phẩm
GET    /foods/category/:category       - Lấy thực phẩm theo loại
GET    /foods/categories/all           - Lấy tất cả categories
GET    /foods/barcode/:barcode         - Tìm thực phẩm theo barcode
GET    /foods/popular/list             - Lấy thực phẩm phổ biến
GET    /foods/recent/list              - Lấy thực phẩm mới thêm
```

### Nutrition & Analysis
```
POST   /foods/:foodId/nutrition        - Tính dinh dưỡng theo số lượng
POST   /foods/nutrition/compare        - So sánh dinh dưỡng nhiều thực phẩm
GET    /nutrition/daily/:date          - Tổng kết dinh dưỡng theo ngày
GET    /nutrition/range/:start/:end    - Tổng kết dinh dưỡng theo khoảng
GET    /meals/:mealId/analysis         - Phân tích dinh dưỡng bữa ăn
POST   /meals/recommendations          - Đề xuất bữa ăn
```

## Database Schema

### Tables Used
- `foods` - Thông tin thực phẩm và dinh dưỡng
- `meals` - Thông tin bữa ăn của user
- `meal_foods` - Junction table liên kết meal và food với số lượng

### Key Features
- Tự động tính toán nutrition totals khi thêm/sửa food vào meal
- Hỗ trợ multiple serving units
- Full-text search cho foods
- Indexes được tối ưu cho performance

## Development

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
npm start
```

### Environment Variables
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meal_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret-key
PORT=3004
```

## Integration với User Service

Meal Service hoạt động độc lập nhưng cần authentication từ User Service thông qua JWT tokens. Có thể tích hợp với User Service để:

1. Lấy thông tin nutrition goals của user
2. Tính toán goal progress
3. Personalized meal recommendations dựa trên user profile

## Usage Examples

### Tạo bữa ăn mới
```json
POST /meals
{
  "meal_type": "Breakfast",
  "meal_date": "2024-11-15",
  "meal_time": "08:00",
  "meal_name": "Healthy Breakfast",
  "notes": "Light breakfast before workout"
}
```

### Thêm thực phẩm vào bữa ăn
```json
POST /meals/{mealId}/foods
{
  "food_id": "uuid-here",
  "quantity": 150,
  "unit": "grams",
  "notes": "Medium portion"
}
```

### Tìm kiếm thực phẩm
```
GET /foods?search_term=chicken&is_vegetarian=false&max_calories=200&limit=20
```

### Đề xuất bữa ăn
```json
POST /meals/recommendations
{
  "meal_type": "Lunch",
  "target_calories": 600,
  "target_protein": 30,
  "dietary_restrictions": ["vegetarian"],
  "exclude_allergens": ["nuts", "dairy"]
}
```