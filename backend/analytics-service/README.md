# Analytics Service (Node.js)

Microservice phụ trách đồng bộ dữ liệu phân tích cho người dùng cuối "My Health & Habit Dashboard". Service được viết bằng TypeScript/Node.js, lưu trữ dữ liệu tiền tổng hợp trong MongoDB và chỉ expose API đọc.

## Chức năng chính
- RabbitMQ consumers cho các sự kiện `meal.logged`, `workout.logged`, `user.goal.updated`, `user.bodymetrics.updated`.
- Tính toán calorie balance, macro breakdown, streaks, health score và workout histogram trên từng ngày.
- REST API phục vụ frontend:
  - `GET /analytics/users/:userId/health-summary?range=7d|30d|90d&from=&to=`
  - `GET /analytics/users/:userId/habit-score?from=YYYY-MM-DD&to=YYYY-MM-DD`

## Chạy cục bộ
```bash
cd backend/analytics-service
npm install
npm run dev # hoặc npm run build && npm start
```

## Biến môi trường
- `PORT` (mặc định 8080)
- `MONGO_URI` (ví dụ: `mongodb://analytics:analytics@mongodb:27017/analytics_service?authSource=analytics_service`)
- `RABBITMQ_URL` (ví dụ: `amqp://admin:admin@rabbitmq:5672`)
- `RABBITMQ_EXCHANGE` (mặc định `fitfood.events`)
- `RABBITMQ_*_QUEUE` (các queue cho meal/workout/goal/body)

Service yêu cầu MongoDB 7.x và RabbitMQ. Dockerfile đã sẵn sàng để build image production.
