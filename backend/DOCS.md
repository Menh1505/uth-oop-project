# 📚 Documentation Index

Chào mừng bạn đến với hệ thống Microservices Backend! Dưới đây là tổng hợp tài liệu để giúp bạn hiểu và sử dụng dự án.

## 🚀 Bắt đầu nhanh

- **[QUICKSTART.md](QUICKSTART.md)** - Hướng dẫn khởi động nhanh (5 phút)
- **[setup.sh](setup.sh)** - Script tự động setup hệ thống

```bash
# Cách nhanh nhất để bắt đầu
./setup.sh
```

## 📖 Tài liệu chính

- **[README.md](README.md)** - Hướng dẫn đầy đủ về dự án
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Kiến trúc và thiết kế hệ thống

## 📂 Cấu trúc dự án

```
backend/
├── 📄 README.md              # Hướng dẫn chính
├── 📄 QUICKSTART.md          # Bắt đầu nhanh  
├── 📄 ARCHITECTURE.md        # Kiến trúc hệ thống
├── 📄 DOCS.md               # Tài liệu này
├── 🚀 setup.sh              # Script setup tự động
├── 🐳 docker-compose.yml    # Docker services
├── 📁 auth-service/         # Service xác thực
├── 📁 user-service/         # Service người dùng
├── 📁 admin-service/        # Service quản trị
├── 📁 migrations/           # Database schemas
└── 📁 nginx/               # Gateway configuration
```

## 🎯 Hướng dẫn theo mục đích

### 👨‍💻 Dành cho Developer

1. **Bắt đầu**: [QUICKSTART.md](QUICKSTART.md)
2. **Phát triển**: [README.md#development](README.md#-development)  
3. **API Testing**: [README.md#testing](README.md#-testing)
4. **Troubleshooting**: [README.md#troubleshooting](README.md#-troubleshooting)

### 🏗️ Dành cho Architect

1. **Kiến trúc tổng quan**: [ARCHITECTURE.md#overview](ARCHITECTURE.md#-tổng-quan-kiến-trúc)
2. **Service Communication**: [ARCHITECTURE.md#communication](ARCHITECTURE.md#-service-communication)
3. **Database Design**: [ARCHITECTURE.md#database](ARCHITECTURE.md#️-database-design)
4. **Scalability**: [ARCHITECTURE.md#scalability](ARCHITECTURE.md#-scalability-considerations)

### 🚀 Dành cho DevOps

1. **Deployment**: [README.md#configuration](README.md#-configuration)
2. **Monitoring**: [ARCHITECTURE.md#monitoring](ARCHITECTURE.md#-monitoring--observability)
3. **Security**: [ARCHITECTURE.md#security](ARCHITECTURE.md#️-security-considerations)
4. **Auto Setup**: [setup.sh](setup.sh)

## 🌐 API Documentation

### Endpoints chính

| Service | Base URL | Documentation |
|---------|----------|---------------|
| **Gateway** | `http://localhost:3000` | [README.md](README.md#-services-và-endpoints) |
| **Auth** | `/api/auth/*` | JWT Authentication, User Registration |
| **User** | `/api/user/*` | User Management, Profiles |
| **Admin** | `/api/admin/*` | Admin Panel, System Management |

### Authentication

```bash
# Đăng ký
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'

# Đăng nhập  
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

## 🛠️ Scripts tiện ích

### Setup & Management

```bash
# Setup hoàn chỉnh hệ thống
./setup.sh

# Khởi động services
docker compose up -d

# Xem logs
docker compose logs -f

# Dừng hệ thống
docker compose down

# Reset database
docker compose down -v
```

### Development

```bash
# Chỉ chạy database & message queue
docker compose up postgres rabbitmq -d

# Development mode (trong từng service folder)
npm run dev
```

## 🔧 Cấu hình

### Environment Variables

Xem chi tiết trong [README.md#configuration](README.md#-configuration)

### Database

- **PostgreSQL**: 3 databases riêng biệt cho từng service
- **Default admin**: `admin@example.com` / `password`
- **Migrations**: Tự động chạy khi khởi động

### Message Queue

- **RabbitMQ**: AMQP messaging
- **Management UI**: http://localhost:15672 (admin/admin)

## 🐛 Troubleshooting

### Vấn đề thường gặp

| Vấn đề | Giải pháp |
|--------|-----------|
| Port conflict | `sudo lsof -i :PORT` để check & kill process |
| Database error | `docker compose down -v && docker compose up -d` |
| Service not starting | `docker compose logs SERVICE_NAME` |
| Permission denied | `chmod +x setup.sh` |

### Debug Commands

```bash
# Kiểm tra container status
docker ps

# Xem logs chi tiết
docker compose logs SERVICE_NAME

# Vào container để debug
docker compose exec SERVICE_NAME sh

# Test API connectivity
curl -i http://localhost:3000/api/auth/
```

## 🤝 Contributing

### Workflow

1. **Fork** repository
2. **Clone** về local: `git clone <your-fork>`
3. **Branch** mới: `git checkout -b feature/new-feature`
4. **Develop** & test
5. **Commit**: `git commit -m "Add new feature"`
6. **Push**: `git push origin feature/new-feature`  
7. **Pull Request** về main repository

### Code Standards

- **TypeScript** cho type safety
- **ESLint** cho code quality
- **Prettier** cho code formatting
- **Jest** cho unit testing

## 📞 Support

### Liên hệ hỗ trợ

- **Issues**: Tạo issue trên GitHub repository
- **Documentation**: Cập nhật trong các file MD này
- **Code Review**: Pull Request process

### Học thêm

- **Microservices**: [Microservices.io](https://microservices.io/)
- **Docker**: [Docker Documentation](https://docs.docker.com/)
- **Node.js**: [Node.js Documentation](https://nodejs.org/docs/)
- **PostgreSQL**: [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- **RabbitMQ**: [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)

---

## 📋 Checklist cho người mới

- [ ] Đọc [QUICKSTART.md](QUICKSTART.md)
- [ ] Chạy `./setup.sh` để setup hệ thống
- [ ] Test API với `curl http://localhost:3000/api/auth/`
- [ ] Truy cập RabbitMQ UI: http://localhost:15672
- [ ] Đọc [ARCHITECTURE.md](ARCHITECTURE.md) để hiểu kiến trúc
- [ ] Thử develop một feature mới
- [ ] Contribute back to the project

**Happy Coding! 🚀**