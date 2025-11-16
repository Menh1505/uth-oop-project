# Microservices Backend System

## 📖 Tổng quan

Đây là một hệ thống backend microservices được xây dựng với Node.js, TypeScript, PostgreSQL, RabbitMQ và Docker. Hệ thống bao gồm 3 service chính:

- **Auth Service**: Quản lý xác thực và phân quyền
- **User Service**: Quản lý thông tin người dùng
- **Admin Service**: Quản lý hệ thống và báo cáo

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│  Nginx Gateway  │
└─────────────────┘    └─────────┬───────┘
                                 │ :3000
                    ┌────────────┼────────────┐
                    │            │            │
             ┌──────▼──────┐ ┌───▼────┐ ┌────▼─────┐
             │Auth Service │ │  User  │ │  Admin   │
             │   :3001     │ │Service │ │ Service  │
             └──────┬──────┘ │ :3002  │ │  :3003   │
                    │        └───┬────┘ └────┬─────┘
                    │            │           │
        ┌───────────┼────────────┼───────────┼───────────┐
        │           │            │           │           │
   ┌────▼────┐ ┌───▼─────┐ ┌────▼─────┐ ┌──▼──────┐ ┌──▼────┐
   │ auth_db │ │ user_db │ │ admin_db │ │RabbitMQ │ │ Redis │
   └─────────┘ └─────────┘ └──────────┘ └─────────┘ └───────┘
```

## 🚀 Cách khởi động dự án

### Yêu cầu hệ thống

- Docker & Docker Compose
- Node.js 18+ (nếu chạy local development)
- Git

### 1. Clone và di chuyển vào thư mục dự án

```bash
git clone <repository-url>
cd uth-oop-project/backend
```

### 2. Khởi động toàn bộ hệ thống

```bash
# Khởi động tất cả services với Docker Compose
docker compose up -d

# Hoặc khởi động và theo dõi logs
docker compose up
```

### 3. Kiểm tra trạng thái

```bash
# Xem các container đang chạy
docker ps

# Xem logs của tất cả services
docker compose logs -f

# Xem logs của một service cụ thể
docker compose logs -f auth-service
```

## 🌐 Services và Endpoints

### API Gateway (Nginx) - Port 3000

| Endpoint | Target Service | Mô tả |
|----------|----------------|-------|
| `/api/auth/*` | Auth Service | API xác thực |
| `/api/user/*` | User Service | API người dùng |
| `/api/admin/*` | Admin Service | API quản trị |
| `/dashboard` | Admin Service | Admin Dashboard |

### Auth Service - Port 3001

```bash
# Các API chính
POST /register          # Đăng ký tài khoản
POST /login             # Đăng nhập
POST /logout            # Đăng xuất
POST /refresh           # Làm mới token
GET  /profile           # Thông tin profile
PUT  /profile           # Cập nhật profile
```

### User Service - Port 3002

```bash
# Các API chính
GET    /users           # Danh sách người dùng
GET    /users/:id       # Chi tiết người dùng
PUT    /users/:id       # Cập nhật người dùng
DELETE /users/:id       # Xóa người dùng
```

### Admin Service - Port 3003

```bash
# Các API chính
GET /dashboard          # Dashboard admin
GET /users              # Quản lý người dùng
GET /reports            # Báo cáo hệ thống
GET /settings           # Cài đặt hệ thống
```

## 🗄️ Database

### PostgreSQL - Port 5432

Hệ thống sử dụng 3 database riêng biệt:

- **auth_db**: Lưu trữ thông tin xác thực, roles, permissions
- **user_db**: Lưu trữ thông tin người dùng, profiles
- **admin_db**: Lưu trữ logs, reports, system settings

### Default Admin User

```
Email: admin@example.com
Username: admin
Password: password
```

## 📨 Message Queue

### RabbitMQ - Port 5672

- **Management UI**: http://localhost:15672
- **Username/Password**: admin/admin

### Message Patterns

```javascript
// User events
'user.created'     // Khi tạo user mới
'user.updated'     // Khi cập nhật user
'user.deleted'     // Khi xóa user
'user.logged_in'   // Khi user đăng nhập
```

## 🛠️ Development

### Chạy development mode

```bash
# Chỉ khởi động database và RabbitMQ
docker compose up postgres rabbitmq -d

# Chạy các service ở chế độ development
cd auth-service && npm run dev
cd user-service && npm run dev  
cd admin-service && npm run dev
```

### Cấu trúc thư mục

```
backend/
├── auth-service/           # Service xác thực
│   ├── src/
│   │   ├── controllers/    # Controllers
│   │   ├── middleware/     # Middleware
│   │   ├── models/         # Models
│   │   ├── routes/         # Routes
│   │   ├── services/       # Business logic
│   │   └── config/         # Configuration
│   ├── Dockerfile
│   └── package.json
├── user-service/           # Service người dùng
├── admin-service/          # Service quản trị
├── migrations/             # Database migrations
│   ├── auth_db.sql
│   ├── user_db.sql
│   └── admin_db.sql
├── nginx/                  # Nginx configuration
│   └── nginx.conf
├── docker-compose.yml      # Docker services
└── README.md
```

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **Port đã được sử dụng**
```bash
# Kiểm tra port đang sử dụng
sudo lsof -i :5432
sudo lsof -i :3000

# Dừng service cục bộ
sudo systemctl stop postgresql
```

2. **Container không khởi động**
```bash
# Xem logs chi tiết
docker compose logs [service-name]

# Restart service
docker compose restart [service-name]
```

3. **Database connection error**
```bash
# Reset database
docker compose down -v
docker compose up postgres -d
```

### Làm sạch hệ thống

```bash
# Dừng và xóa tất cả containers
docker compose down

# Dừng và xóa cả volumes (reset database)
docker compose down -v

# Xóa images (rebuild từ đầu)
docker compose down --rmi all
```

## 🔧 Configuration

### Environment Variables

Các biến môi trường được cấu hình trong `docker-compose.yml`:

```yaml
# Database
DATABASE_URL=postgresql://postgres:postgres_password@postgres:5432/auth_db
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=postgres_password
DB_NAME=auth_db
DB_PORT=5432

# JWT
JWT_SECRET=shared-jwt-secret-key-12345

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
```

## 📊 Monitoring

### Health Checks

```bash
# Kiểm tra tất cả services
curl http://localhost:3000/api/auth/
curl http://localhost:3000/api/user/
curl http://localhost:3000/api/admin/

# RabbitMQ Management
open http://localhost:15672
```

### Logs

```bash
# Theo dõi logs realtime
docker compose logs -f

# Logs của service cụ thể
docker compose logs -f auth-service
docker compose logs -f user-service
docker compose logs -f admin-service
```

## 🚦 Testing

### API Testing với curl

```bash
# Test Auth Service
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Test User Service
curl -X GET http://localhost:3000/api/user/ \
  -H "Authorization: Bearer <your-token>"

# Test Admin Service
curl -X GET http://localhost:3000/api/admin/ \
  -H "Authorization: Bearer <admin-token>"
```

## 📝 Notes

- Hệ thống sử dụng JWT cho authentication
- Các service giao tiếp qua HTTP REST API và RabbitMQ
- Database migrations tự động chạy khi khởi động
- Nginx làm API Gateway và load balancer
- Tất cả services chạy trong Docker containers

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

This project is licensed under the MIT License.