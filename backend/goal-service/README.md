# Goal Service

Dịch vụ quản lý mục tiêu thể dục cho ứng dụng fitness, cung cấp API để quản lý mục tiêu, theo dõi tiến trình và đưa ra khuyến nghị điều chỉnh.

## Tính năng chính

- **Quản lý mục tiêu**: Thêm, sửa, xóa mục tiêu thể dục (giảm mỡ, tăng cơ, duy trì cân nặng)
- **Theo dõi tiến trình**: Đánh giá và cập nhật tiến độ thực hiện mục tiêu
- **Khuyến nghị thông minh**: Đề xuất điều chỉnh mục tiêu dựa trên kết quả thực tế
- **Thống kê chi tiết**: Phân tích hiệu suất và xu hướng đạt mục tiêu
- **Template mục tiêu**: Các mẫu mục tiêu có sẵn cho người dùng mới

## Cấu trúc dự án

```
goal-service/
├── src/
│   ├── config/
│   │   ├── database.ts      # Cấu hình database PostgreSQL
│   │   ├── jwt.ts           # Cấu hình JWT authentication
│   │   ├── logger.ts        # Cấu hình logging với Pino
│   │   └── rabbitmq.ts      # Cấu hình message queue
│   ├── controllers/
│   │   └── GoalController.ts    # HTTP request handlers
│   ├── middleware/
│   │   ├── authenticate.ts  # JWT authentication middleware
│   │   └── errorHandler.ts  # Global error handler
│   ├── models/
│   │   └── Goal.ts          # Type definitions và interfaces
│   ├── repositories/
│   │   └── GoalRepository.ts    # Database operations
│   ├── routes/
│   │   └── GoalRoutes.ts        # API route definitions
│   ├── services/
│   │   └── GoalService.ts       # Business logic
│   └── server.ts           # Main application server
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### 🎯 Quản lý Mục tiêu (Goals)

#### 1. Tạo mục tiêu mới (Admin)
```
POST /goals
```
**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "goal_type": "Reduce Fat",
  "target_calories": 2000,
  "target_protein": 120,
  "target_carbs": 200,
  "target_fat": 70,
  "target_weight": 75,
  "target_duration_weeks": 12,
  "description": "Healthy fat loss goal with balanced nutrition"
}
```

#### 2. Lấy thông tin mục tiêu
```
GET /goals/:goalId
```

#### 3. Cập nhật mục tiêu (Admin)
```
PUT /goals/:goalId
```

#### 4. Xóa mục tiêu (Admin)
```
DELETE /goals/:goalId
```

#### 5. Lấy danh sách mục tiêu
```
GET /goals?goal_type=Reduce%20Fat&is_active=true&page=1&limit=10
```

#### 6. Mục tiêu phổ biến
```
GET /goals/popular/list?limit=5
```

### 👤 Quản lý Mục tiêu Người dùng

#### 7. Gán mục tiêu cho người dùng
```
POST /goals/user-goals
```
**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "goal_id": "uuid-goal-id",
  "target_completion_date": "2024-03-01",
  "notes": "Starting my fat loss journey"
}
```

#### 8. Lấy mục tiêu của người dùng
```
GET /goals/user-goals?status=Active&goal_type=Build%20Muscle&page=1&limit=10
```
**Headers**: `Authorization: Bearer <token>`

#### 9. Cập nhật mục tiêu người dùng
```
PUT /goals/user-goals/:userGoalId
```
**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "progress_percentage": 65,
  "status": "Active",
  "notes": "Making good progress on muscle building"
}
```

#### 10. Xóa mục tiêu người dùng
```
DELETE /goals/user-goals/:userGoalId
```

### 📊 Theo dõi Tiến trình

#### 11. Lấy tiến trình chi tiết
```
GET /goals/user-goals/:userGoalId/progress
```
**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "user_goal_id": "uuid",
    "goal_type": "Reduce Fat",
    "target_metrics": {
      "calories": 2000,
      "protein": 120,
      "weight": 75,
      "duration_weeks": 12
    },
    "current_metrics": {
      "current_weight": 78,
      "average_daily_calories": 1950,
      "days_active": 45,
      "weeks_completed": 6
    },
    "progress_percentage": 65,
    "days_remaining": 39,
    "is_on_track": true,
    "recommendations": [
      "Great progress! You're ahead of schedule.",
      "Consider adding more strength training to preserve muscle mass."
    ]
  }
}
```

#### 12. Cập nhật tiến trình
```
PUT /goals/user-goals/:userGoalId/progress
```
**Body**:
```json
{
  "progress_percentage": 70
}
```

#### 13. Thống kê mục tiêu người dùng
```
GET /goals/statistics/user
```
**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "total_goals": 8,
    "active_goals": 3,
    "completed_goals": 4,
    "paused_goals": 1,
    "cancelled_goals": 0,
    "completion_rate": 50,
    "average_completion_time_days": 85,
    "most_common_goal_type": "Reduce Fat",
    "goals_by_type": {
      "Reduce Fat": 3,
      "Build Muscle": 2,
      "Maintain Weight": 2,
      "General Fitness": 1
    },
    "monthly_progress": [
      {
        "month": "2024-01",
        "goals_started": 2,
        "goals_completed": 1,
        "average_progress": 85.5
      }
    ]
  }
}
```

#### 14. Mục tiêu sắp hết hạn
```
GET /goals/deadline/near?days=7
```

#### 15. Hoạt động gần đây
```
GET /goals/activity/recent?days=30
```

### 🤖 Khuyến nghị và Gợi ý

#### 16. Khuyến nghị mục tiêu mới
```
GET /goals/recommendations/goals
```
**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "goal_type": "Build Muscle",
      "recommended_metrics": {
        "calories": 2400,
        "protein": 140,
        "duration_weeks": 16
      },
      "reasoning": "Based on your successful fat loss, building muscle will improve body composition.",
      "priority": "High",
      "estimated_duration_weeks": 16,
      "success_probability": 85
    }
  ]
}
```

#### 17. Gợi ý điều chỉnh mục tiêu
```
GET /goals/user-goals/:userGoalId/suggestions
```
**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "user_goal_id": "uuid",
      "suggested_metrics": {
        "target_duration_weeks": 14
      },
      "reasoning": "Extending timeline by 2 weeks may help achieve better results.",
      "adjustment_type": "Modify Timeline",
      "confidence_level": 85
    }
  ]
}
```

#### 18. Template mục tiêu
```
GET /goals/templates/list
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "template_id": "template-1",
      "name": "Beginner Fat Loss",
      "goal_type": "Reduce Fat",
      "default_metrics": {
        "calories": 2000,
        "duration_weeks": 12
      },
      "description": "A sustainable fat loss plan for beginners",
      "difficulty_level": "Beginner",
      "estimated_duration_weeks": 12,
      "tips": [
        "Create a moderate calorie deficit",
        "Focus on whole foods",
        "Include cardio 3-4 times per week"
      ],
      "is_popular": true
    }
  ]
}
```

#### 19. Tạo mục tiêu từ template
```
POST /goals/templates/:templateId/create
```
**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "customizations": {
    "calories": 1800,
    "duration_weeks": 10
  }
}
```

#### 20. Gợi ý mục tiêu thông minh
```
GET /goals/suggestions/smart
```
**Headers**: `Authorization: Bearer <token>`

## Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
Tạo file `.env`:
```env
PORT=3006
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
docker build -t goal-service .
docker run -p 3006:3006 goal-service
```

## Testing

### Health Check
```bash
curl http://localhost:3006/health
```

### Test API endpoints
```bash
# Tạo mục tiêu mới (Admin)
curl -X POST http://localhost:3006/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "goal_type": "Reduce Fat",
    "target_calories": 2000,
    "target_duration_weeks": 12,
    "description": "Healthy weight loss goal"
  }'

# Gán mục tiêu cho người dùng
curl -X POST http://localhost:3006/goals/user-goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "goal_id": "goal-uuid",
    "target_completion_date": "2024-03-01"
  }'

# Lấy thống kê
curl http://localhost:3006/goals/statistics/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Thuật toán Đánh giá và Khuyến nghị

### 1. Đánh giá Tiến trình
```
Progress Score = (Current Metrics / Target Metrics) × 100
Timeline Progress = Days Active / Total Duration Days
Is On Track = Progress Score >= Timeline Progress
```

### 2. Điểm Khuyến nghị Mục tiêu
```
Base Score = Popularity + Historical Success Rate
Goal Alignment = User History Match + Current Goals Complement
Difficulty Match = User Experience Level Match
Success Probability = Base Score + Goal Alignment + Difficulty Match
```

### 3. Gợi ý Điều chỉnh
- **Slow Progress** (< 25%): Giảm target hoặc gia hạn timeline
- **Good Progress** (25-75%): Khuyến khích và theo dõi
- **Excellent Progress** (> 75%): Tăng target hoặc đặt mục tiêu mới

## Database Schema

### Goals Table
```sql
- goal_id (UUID, Primary Key)
- goal_type (VARCHAR) - Reduce Fat, Build Muscle, etc.
- target_calories (INTEGER)
- target_protein/carbs/fat (DECIMAL)
- target_weight (DECIMAL)
- target_duration_weeks (INTEGER)
- description (TEXT)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

### User Goals Table
```sql
- user_goal_id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- goal_id (UUID, Foreign Key)
- assigned_date (TIMESTAMP)
- target_completion_date (TIMESTAMP)
- actual_completion_date (TIMESTAMP)
- progress_percentage (DECIMAL 0-100)
- status (VARCHAR) - Active, Completed, Paused, Cancelled
- notes (TEXT)
- created_at, updated_at (TIMESTAMP)
```

## Lưu ý kỹ thuật

- **Authentication**: Sử dụng JWT tokens cho xác thực
- **Database**: PostgreSQL với connection pooling
- **Logging**: Pino logger với structured logging
- **Error Handling**: Global error handler với proper HTTP status codes
- **Validation**: Comprehensive business logic validation
- **Progress Calculation**: Real-time progress tracking với smart recommendations
- **Templates**: Pre-built goal templates cho người dùng mới

## Integration với Other Services

### Meal Service
- Lấy dữ liệu nutrition để tính toán progress
- Calorie intake vs target calories

### Exercise Service  
- Lấy dữ liệu exercise để đánh giá activity level
- Exercise performance vs fitness goals

### User Service
- User profile data cho personalized recommendations
- Weight tracking history

## Contribution

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

## License

MIT License - see LICENSE file for details.