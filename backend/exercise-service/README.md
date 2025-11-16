# Exercise Service

Dịch vụ quản lý bài tập thể dục cho ứng dụng fitness, cung cấp API để quản lý bài tập, phân tích lượng calo tiêu hao và đề xuất bài tập phù hợp.

## Tính năng chính

- **Quản lý bài tập**: Thêm, sửa, xóa bài tập thể dục
- **Phân tích lượng calo**: Tính toán calo tiêu hao dựa trên MET values
- **Đề xuất bài tập**: Gợi ý bài tập phù hợp với mục tiêu và thể trạng
- **Thống kê chi tiết**: Theo dõi hiệu suất và xu hướng tập luyện
- **Bộ lọc nâng cao**: Tìm kiếm bài tập theo nhiều tiêu chí

## Cấu trúc dự án

```
exercise-service/
├── src/
│   ├── config/
│   │   ├── database.ts      # Cấu hình database PostgreSQL
│   │   ├── jwt.ts           # Cấu hình JWT authentication
│   │   ├── logger.ts        # Cấu hình logging với Pino
│   │   └── rabbitmq.ts      # Cấu hình message queue
│   ├── controllers/
│   │   └── ExerciseController.ts  # HTTP request handlers
│   ├── middleware/
│   │   ├── authenticate.ts  # JWT authentication middleware
│   │   └── errorHandler.ts  # Global error handler
│   ├── models/
│   │   └── Exercise.ts      # Type definitions và interfaces
│   ├── repositories/
│   │   └── ExerciseRepository.ts  # Database operations
│   ├── routes/
│   │   └── ExerciseRoutes.ts      # API route definitions
│   ├── services/
│   │   └── ExerciseService.ts     # Business logic
│   └── server.ts           # Main application server
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### CRUD Operations

#### 1. Tạo bài tập mới
```
POST /exercises
```
**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "name": "Push-ups",
  "type": "Strength",
  "muscle_groups": ["Chest", "Triceps", "Shoulders"],
  "equipment": "None",
  "difficulty_level": "Beginner",
  "instructions": "Start in plank position...",
  "duration_minutes": 10,
  "sets": 3,
  "reps": 15,
  "weight_kg": null,
  "distance_km": null,
  "calories_per_minute": 8.5
}
```

#### 2. Lấy thông tin bài tập
```
GET /exercises/:exerciseId
```
**Headers**: `Authorization: Bearer <token>`

#### 3. Cập nhật bài tập
```
PUT /exercises/:exerciseId
```
**Headers**: `Authorization: Bearer <token>`

#### 4. Xóa bài tập
```
DELETE /exercises/:exerciseId
```
**Headers**: `Authorization: Bearer <token>`

### Tìm kiếm và lọc

#### 5. Lấy danh sách bài tập với bộ lọc
```
GET /exercises?type=Cardio&difficulty=Beginner&muscle_groups=Chest,Arms
```
**Query Parameters**:
- `type`: Loại bài tập (Cardio, Strength, Flexibility, Sports)
- `difficulty`: Mức độ khó (Beginner, Intermediate, Advanced)
- `muscle_groups`: Nhóm cơ (Chest, Arms, Legs, etc.)
- `equipment`: Dụng cụ cần thiết
- `duration_min`, `duration_max`: Thời gian (phút)
- `calories_min`, `calories_max`: Lượng calo
- `page`, `limit`: Phân trang

#### 6. Lấy bài tập theo ngày
```
GET /exercises/date/2024-01-15
```

#### 7. Lấy bài tập theo khoảng thời gian
```
GET /exercises/range/2024-01-01/2024-01-31
```

### Thống kê và phân tích

#### 8. Thống kê tổng quan
```
GET /exercises/statistics/user
```
**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "totalExercises": 45,
  "totalDuration": 120,
  "totalCaloriesBurned": 3500,
  "averageDuration": 25.5,
  "averageCaloriesPerSession": 280,
  "mostFrequentType": "Cardio",
  "exercisesByType": {
    "Cardio": 20,
    "Strength": 15,
    "Flexibility": 10
  }
}
```

#### 9. Tóm tắt theo ngày
```
GET /exercises/summary/daily/2024-01-15
```

#### 10. Metrics hiệu suất bài tập
```
GET /exercises/performance/Push-ups
```

### Đề xuất và gợi ý

#### 11. Đề xuất bài tập cá nhân hóa
```
POST /exercises/recommendations
```
**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "goals": ["weight_loss", "muscle_gain"],
  "available_time": 30,
  "equipment": ["dumbbells", "resistance_bands"],
  "fitness_level": "intermediate",
  "preferences": {
    "types": ["Strength", "Cardio"],
    "muscle_groups": ["Chest", "Arms"]
  }
}
```

**Response**:
```json
{
  "recommendations": [
    {
      "exercise": {
        "exercise_id": 1,
        "name": "Dumbbell Press",
        "type": "Strength"
      },
      "score": 8.5,
      "reason": "Matches your muscle building goal and available equipment"
    }
  ],
  "total_estimated_duration": 28,
  "estimated_calories": 320
}
```

#### 12. Bài tập phổ biến
```
GET /exercises/popular/list?limit=10&period=month
```

#### 13. Ước tính lượng calo
```
POST /exercises/calories/estimate
```
**Body**:
```json
{
  "user_weight_kg": 70,
  "exercise_name": "Running",
  "duration_minutes": 30,
  "intensity": "moderate"
}
```

## Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
Tạo file `.env`:
```env
PORT=3005
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitness_db
DB_USER=fitness_user
DB_PASSWORD=fitness_pass
JWT_SECRET=your-secret-key
RABBITMQ_URL=amqp://localhost:5672
```

### 3. Chạy migrations
```bash
# Từ thư mục backend root
./run-migrations.sh
```

### 4. Khởi chạy service

#### Development mode:
```bash
npm run dev
```

#### Production mode:
```bash
npm run build
npm start
```

### 5. Chạy với Docker
```bash
docker build -t exercise-service .
docker run -p 3005:3005 exercise-service
```

## Testing

### Health Check
```bash
curl http://localhost:3005/health
```

### Test API endpoints
```bash
# Tạo bài tập mới
curl -X POST http://localhost:3005/exercises \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Morning Jog",
    "type": "Cardio",
    "muscle_groups": ["Legs", "Core"],
    "equipment": "None",
    "difficulty_level": "Beginner",
    "duration_minutes": 30,
    "calories_per_minute": 10
  }'

# Lấy thống kê
curl http://localhost:3005/exercises/statistics/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Thuật toán đề xuất

Service sử dụng thuật toán scoring thông minh để đề xuất bài tập:

1. **Base Score**: Điểm cơ bản từ popularity và rating
2. **Goal Alignment**: Điểm phù hợp với mục tiêu (weight loss, muscle gain, endurance)
3. **Equipment Match**: Điểm tương thích với dụng cụ có sẵn
4. **Time Constraint**: Điểm phù hợp với thời gian
5. **Difficulty Match**: Điểm phù hợp với trình độ
6. **Variety Bonus**: Điểm thưởng cho sự đa dạng
7. **Recent Activity**: Điểm dựa trên hoạt động gần đây

## Lưu ý kỹ thuật

- **Authentication**: Sử dụng JWT tokens cho xác thực
- **Database**: PostgreSQL với connection pooling
- **Logging**: Pino logger với structured logging
- **Error Handling**: Global error handler với proper HTTP status codes
- **Validation**: Joi schema validation cho request data
- **Performance**: Prepared statements và query optimization
- **Monitoring**: Health check endpoint và metrics tracking

## Contribution

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

## License

MIT License - see LICENSE file for details.