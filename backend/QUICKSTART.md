# Quick Start Guide

## 🚀 Khởi động nhanh

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Khởi động tất cả services
docker compose up -d

# 3. Kiểm tra trạng thái
docker ps
```

## 🌐 Truy cập các services

| Service | URL | Mô tả |
|---------|-----|-------|
| **API Gateway** | http://localhost:3000 | Điểm vào chính |
| **Auth Service** | http://localhost:3011 | Xác thực người dùng |
| **User Service** | http://localhost:3012 | Quản lý người dùng |
| **Admin Service** | http://localhost:3013 | Quản trị hệ thống |
| **Workout Service** | http://localhost:3015 | Quản lý tập luyện |
| **Nutrition Service** | http://localhost:3016 | Theo dõi dinh dưỡng |
| **RabbitMQ UI** | http://localhost:15672 | Quản lý message queue (admin/admin) |

## 📱 Test API

```bash
# Test kết nối
curl http://localhost:3000/api/auth/
curl http://localhost:3015/api/workouts/health
curl http://localhost:3016/api/nutrition/health

# Xem logs
docker compose logs -f

# Xem logs của service cụ thể  
docker compose logs -f nutrition-service
```

## 🛑 Dừng hệ thống

```bash
# Dừng tất cả
docker compose down

# Dừng và reset database
docker compose down -v
```

---
📖 **Chi tiết đầy đủ**: Xem [README.md](README.md)