# FitFood Database Setup Documentation

## Tổng quan

Hệ thống database FitFood sử dụng PostgreSQL với các migration scripts được tổ chức theo thứ tự để tạo schema hoàn chỉnh theo ERD đã thiết kế.

## Cấu trúc Database

### Databases
- `auth_db`: Database cho authentication service
- `user_db`: Database cho user service  
- `fitfood_db`: Database chính chứa toàn bộ schema FitFood

### Schema chính (fitfood_db)
Theo ERD đã thiết kế, bao gồm các bảng:

1. **users** - Thông tin người dùng
2. **subscriptions** - Gói đăng ký (1-1 với users)
3. **goals** - Các mục tiêu fitness
4. **user_goals** - Liên kết users và goals (M-N)
5. **foods** - Thông tin thực phẩm và dinh dưỡng
6. **meals** - Bữa ăn của người dùng
7. **meal_foods** - Món ăn trong bữa ăn (M-N giữa meals và foods)
8. **exercises** - Bài tập của người dùng
9. **payments** - Lịch sử thanh toán
10. **recommendations** - Gợi ý cá nhân hóa
11. **user_preferences** - Tùy chọn chi tiết của user
12. **exercise_templates** - Mẫu bài tập có sẵn
13. **nutrition_logs** - Tóm tắt dinh dưỡng hàng ngày
14. **user_progress** - Theo dõi tiến độ của user

## Migration Files

### Thứ tự thực hiện:
```
001_create_users_table.sql          - Tạo bảng users chính
002_create_subscriptions_table.sql  - Tạo bảng subscriptions  
003_create_goals_table.sql          - Tạo bảng goals
004_create_user_goals_table.sql     - Tạo bảng liên kết user_goals
005_create_foods_table.sql          - Tạo bảng foods
006_create_meals_table.sql          - Tạo bảng meals
007_create_meal_foods_table.sql     - Tạo bảng liên kết meal_foods
008_create_exercises_table.sql      - Tạo bảng exercises
009_create_payments_table.sql       - Tạo bảng payments
010_create_recommendations_table.sql- Tạo bảng recommendations
011_create_supporting_tables.sql    - Tạo các bảng hỗ trợ
012_insert_sample_data.sql          - Chèn dữ liệu mẫu
```

## Cách sử dụng

### 1. Khởi động với Docker Compose
```bash
# Database sẽ được khởi tạo tự động khi chạy
docker-compose up -d postgres

# Kiểm tra logs để đảm bảo migrations chạy thành công
docker-compose logs postgres
```

### 2. Chạy migrations thủ công (nếu cần)
```bash
# Thiết lập environment variables
export DB_HOST=localhost
export DB_PORT=5432  
export DB_NAME=fitfood_db
export DB_USER=postgres
export DB_PASSWORD=uth

# Chạy migrations
./run-migrations.sh
```

### 3. Kiểm tra trạng thái migrations
```bash
# Xem các migrations đã thực hiện
./rollback-migrations.sh status
```

### 4. Rollback (nếu cần)
```bash
# Reset toàn bộ database
./rollback-migrations.sh reset

# Rollback một migration cụ thể
./rollback-migrations.sh rollback 012_insert_sample_data.sql
```

## Kết nối Database

### Từ ứng dụng:
```
Host: postgres (trong Docker network) hoặc localhost (từ host)
Port: 5432
Database: fitfood_db
Username: postgres  
Password: uth
```

### Connection String:
```
postgresql://postgres:uth@localhost:5432/fitfood_db
```

## Tính năng đặc biệt

### 1. Triggers tự động
- **updated_at**: Tự động cập nhật timestamp khi record thay đổi
- **meal_totals**: Tự động tính tổng calories/nutrients khi thêm/xóa món ăn

### 2. Constraints và Validations
- Check constraints cho các giá trị hợp lệ (tuổi, cân nặng, calories, v.v.)
- Foreign key constraints đảm bảo tính toàn vẹn dữ liệu
- Unique constraints ngăn dữ liệu trùng lặp

### 3. Indexes được tối ưu
- Indexes trên các cột thường dùng để query
- Full-text search index cho tìm kiếm thực phẩm
- Composite indexes cho các query phức tạp

### 4. Dữ liệu mẫu
- Goals mẫu cho các mục tiêu fitness phổ biến
- Foods mẫu với thông tin dinh dưỡng đầy đủ
- Exercise templates cho các bài tập cơ bản

## Lưu ý khi phát triển

1. **Thêm migration mới**: Tạo file mới với số thứ tự tiếp theo (013_*.sql)
2. **Thay đổi schema**: Tạo migration mới, không sửa migration cũ
3. **Backup dữ liệu**: Luôn backup trước khi chạy migration trên production
4. **Test migrations**: Test trên môi trường development trước

## Troubleshooting

### Migration fails:
```bash
# Kiểm tra logs chi tiết
docker-compose logs postgres

# Kiểm tra kết nối database
psql -h localhost -p 5432 -U postgres -d fitfood_db -c "SELECT version();"
```

### Reset database hoàn toàn:
```bash
# Dừng container
docker-compose down

# Xóa volumes
docker volume rm backend_postgres_data

# Khởi động lại
docker-compose up -d postgres
```