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
| **RabbitMQ UI** | http://localhost:15672 | Quản lý message queue (admin/admin) |

## 📱 Test API

```bash
# Test kết nối
curl http://localhost:3000/api/auth/

# Xem logs
docker compose logs -f
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