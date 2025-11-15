# Partner Service

Partner Service quản lý nhà hàng, menu, khuyến mãi và tồn kho cho hệ thống đặt món ăn. Service này liên kết với catalog món ăn để cung cấp giải pháp quản lý đối tác toàn diện.

## 🌟 Tính Năng

### Partner Management
- ✅ Đăng ký và quản lý đối tác nhà hàng
- ✅ Phê duyệt và theo dõi trạng thái đối tác
- ✅ Quản lý hoa hồng và doanh thu
- ✅ Phân tích hiệu suất đối tác

### Restaurant Management  
- ✅ CRUD nhà hàng với thông tin chi tiết
- ✅ Quản lý giờ mở cửa và khu vực giao hàng
- ✅ Tìm kiếm nhà hàng theo vị trí và bộ lọc
- ✅ Đánh giá và xếp hạng nhà hàng
- ✅ Upload hình ảnh và gallery

### Menu Management
- ✅ Quản lý menu items với category
- ✅ Pricing và sale price management
- ✅ Thông tin dinh dưỡng và dietary info
- ✅ Customization options cho món ăn
- ✅ Liên kết với catalog service
- ✅ Availability scheduling

### Promotion System
- ✅ Tạo và quản lý khuyến mãi đa dạng
- ✅ Discount types: percentage, fixed amount, BOGO, free delivery
- ✅ Promo codes và auto-apply promotions
- ✅ Time-based và condition-based promotions
- ✅ Usage limits và tracking

### Inventory Tracking
- ✅ Quản lý tồn kho nguyên liệu
- ✅ Low stock alerts và expiry warnings
- ✅ Supplier management
- ✅ Cost tracking và inventory valuation
- ✅ Auto-update menu item availability

### Analytics & Reporting
- ✅ Partner performance analytics
- ✅ Restaurant metrics và insights
- ✅ Menu popularity analysis
- ✅ Inventory cost analysis
- ✅ Revenue tracking và reporting

## 🏗️ Kiến Trúc

```
partner-service/
├── src/
│   ├── controllers/         # REST API controllers
│   │   └── PartnerController.ts
│   ├── services/           # Business logic
│   │   └── PartnerService.ts
│   ├── models/             # Data models & types
│   │   └── Partner.ts
│   ├── middleware/         # Express middleware
│   │   ├── authMiddleware.ts
│   │   └── errorHandler.ts
│   ├── routes/             # API routes
│   │   └── partnerRoutes.ts
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server startup
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Cài Đặt và Chạy

### Development

```zsh
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build

# Start production server
npm start
```

### Docker

```zsh
# Build image
docker build -t partner-service .

# Run container
docker run -p 3004:3004 partner-service
```

### Docker Compose (Recommended)

```zsh
# Từ thư mục backend
docker-compose up partner-service
```

## 🔧 Cấu Hình

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/partner_db
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=partner_db
DB_PORT=5432

# JWT
JWT_SECRET=your-secret-key

# Server
PORT=3004
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 📋 API Endpoints

### Partner Management

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/partners` | Tạo partner mới | ✅ |
| `GET` | `/api/partners` | Lấy danh sách partners | ✅ |
| `GET` | `/api/partners/:id` | Lấy partner theo ID | ✅ |
| `PUT` | `/api/partners/:id` | Cập nhật partner | ✅ |

### Restaurant Management

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/partners/:partnerId/restaurants` | Tạo restaurant mới | 👑 |
| `GET` | `/api/partners/:partnerId/restaurants` | Lấy restaurants của partner | 👑 |
| `GET` | `/api/restaurants/search` | Tìm kiếm restaurants | ❌ |
| `GET` | `/api/restaurants/:id` | Lấy restaurant theo ID | ✅ |
| `PUT` | `/api/restaurants/:id` | Cập nhật restaurant | 👑 |
| `PATCH` | `/api/restaurants/:id/status` | Cập nhật trạng thái | 👑 |

### Menu Management

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/restaurants/:restaurantId/menu` | Tạo menu item | 👑 |
| `GET` | `/api/restaurants/:restaurantId/menu` | Lấy menu items | ❌ |
| `PUT` | `/api/menu/:id` | Cập nhật menu item | 👑 |
| `PATCH` | `/api/menu/:id/status` | Cập nhật trạng thái | 👑 |

### Promotion Management

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/restaurants/:restaurantId/promotions` | Tạo promotion | 👑 |
| `GET` | `/api/restaurants/:restaurantId/promotions` | Lấy promotions | 👑 |
| `PATCH` | `/api/promotions/:id/status` | Cập nhật trạng thái | 👑 |

### Inventory Management

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/restaurants/:restaurantId/inventory` | Tạo inventory item | 👑 |
| `GET` | `/api/restaurants/:restaurantId/inventory` | Lấy inventory | 👑 |
| `GET` | `/api/restaurants/:restaurantId/inventory/low-stock` | Kiểm tra hàng sắp hết | 👑 |
| `GET` | `/api/restaurants/:restaurantId/inventory/expiring` | Kiểm tra hàng sắp hết hạn | 👑 |

### Analytics

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/api/analytics/partners` | Partner analytics | 👑 |
| `GET` | `/api/analytics/restaurants/:partnerId` | Restaurant analytics | 👑 |

### Admin Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/api/admin/partners` | Admin - All partners | 🔒 |
| `GET` | `/api/admin/analytics` | Admin - Global analytics | 🔒 |

### Health Check

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/health` | Service health check | ❌ |

**Legend**: ❌ Public, ✅ User, 👑 Partner, 🔒 Admin

## 🏪 Restaurant Management

### Đăng Ký Partner
```javascript
POST /api/partners
{
  "business_name": "Nhà Hàng Phố Cổ",
  "business_type": "Restaurant Chain",
  "tax_id": "0123456789-001",
  "contact_person": "Nguyễn Văn A",
  "contact_email": "contact@phocorestaurant.com",
  "contact_phone": "+84901234567",
  "commission_rate": 0.12
}
```

### Tạo Restaurant
```javascript
POST /api/partners/{partnerId}/restaurants
{
  "name": "Phở Cổ Truyền",
  "description": "Phở bò truyền thống Hà Nội",
  "type": "VIETNAMESE",
  "phone": "+84901234567",
  "email": "pho@phocorestaurant.com",
  "address": "123 Phố Cổ, Hoàn Kiếm, Hà Nội",
  "city": "Hà Nội",
  "district": "Hoàn Kiếm",
  "ward": "Phố Cổ",
  "latitude": 21.0285,
  "longitude": 105.8542,
  "delivery_fee": 15000,
  "minimum_order": 50000,
  "delivery_radius": 5.0,
  "opening_hours": {
    "monday": {"open": "06:00", "close": "22:00", "is_closed": false},
    "tuesday": {"open": "06:00", "close": "22:00", "is_closed": false}
  },
  "features": ["delivery", "pickup", "dine_in"]
}
```

### Tìm Kiếm Restaurant
```javascript
GET /api/restaurants/search?city=Hà Nội&type=VIETNAMESE&latitude=21.0285&longitude=105.8542&radius=5&search=phở
```

## 🍽️ Menu Management

### Tạo Menu Item
```javascript
POST /api/restaurants/{restaurantId}/menu
{
  "name": "Phở Bò Tái",
  "description": "Phở bò với thịt tái thơm ngon",
  "category": "MAIN_COURSE",
  "base_price": 65000,
  "currency": "VND",
  "calories": 450,
  "ingredients": ["Bánh phở", "Thịt bò", "Hành lá", "Ngò rí"],
  "dietary_info": ["gluten_free"],
  "available_days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
  "inventory_tracked": true,
  "customization_options": [
    {
      "id": "size",
      "name": "Kích cỡ",
      "type": "SINGLE_CHOICE",
      "required": true,
      "options": [
        {"id": "small", "name": "Nhỏ", "additional_price": 0, "available": true},
        {"id": "large", "name": "Lớn", "additional_price": 10000, "available": true}
      ]
    }
  ]
}
```

## 🎉 Promotion System

### Tạo Promotion
```javascript
POST /api/restaurants/{restaurantId}/promotions
{
  "name": "Giảm giá 20% cho đơn đầu tiên",
  "description": "Chào mừng khách hàng mới",
  "type": "PERCENTAGE",
  "discount_value": 20,
  "max_discount_amount": 50000,
  "min_order_amount": 100000,
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-01-31T23:59:59Z",
  "usage_limit": 1000,
  "applicable_categories": ["MAIN_COURSE"],
  "applicable_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "auto_apply": true
}
```

## 📦 Inventory Management

### Tạo Inventory Item
```javascript
POST /api/restaurants/{restaurantId}/inventory
{
  "menu_item_id": "menu-item-uuid",
  "ingredient_name": "Bánh phở khô",
  "current_stock": 50,
  "minimum_stock": 10,
  "maximum_stock": 100,
  "unit": "kg",
  "cost_per_unit": 25000,
  "supplier_name": "Công ty TNHH Bánh phở Hà Nội",
  "supplier_contact": "supplier@banhpho.com",
  "expiry_date": "2024-12-31"
}
```

### Kiểm Tra Low Stock
```javascript
GET /api/restaurants/{restaurantId}/inventory/low-stock

Response:
{
  "success": true,
  "data": [
    {
      "id": "inventory-uuid",
      "ingredient_name": "Bánh phở khô",
      "current_stock": 8,
      "minimum_stock": 10,
      "status": "LOW_STOCK",
      "menu_item_name": "Phở Bò Tái"
    }
  ],
  "count": 1,
  "message": "Found 1 low stock items"
}
```

## 📊 Database Schema

### Partners Table
```sql
CREATE TABLE partners (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    tax_id VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'PENDING',
    commission_rate DECIMAL(5,4) DEFAULT 0.15,
    total_restaurants INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Restaurants Table
```sql
CREATE TABLE restaurants (
    id UUID PRIMARY KEY,
    partner_id UUID REFERENCES partners(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'CLOSED',
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    opening_hours JSONB DEFAULT '{}',
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    minimum_order DECIMAL(10,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    features JSONB DEFAULT '[]'
);
```

## 🔒 Authentication & Authorization

### Partner Role System
```typescript
// User roles
enum UserRole {
  USER = 'user',
  PARTNER = 'partner', 
  ADMIN = 'admin'
}

// Authorization middleware
requirePartner() // Partner or Admin access
requireAdmin()  // Admin only access
```

### JWT Token Structure
```json
{
  "userId": "user123",
  "email": "partner@restaurant.com",
  "role": "partner",
  "exp": 1640995200
}
```

## 📈 Analytics Examples

### Partner Analytics
```javascript
GET /api/analytics/partners

Response:
{
  "success": true,
  "data": {
    "total_partners": 150,
    "active_partners": 120,
    "new_partners_this_month": 15,
    "total_revenue": 2500000000,
    "average_commission_rate": 0.15,
    "top_performing_partners": [
      {
        "partner_id": "partner-uuid",
        "business_name": "Nhà Hàng Phố Cổ",
        "revenue": 150000000,
        "restaurant_count": 5
      }
    ]
  }
}
```

### Restaurant Analytics
```javascript
GET /api/analytics/restaurants/{partnerId}

Response:
{
  "success": true,
  "data": {
    "total_restaurants": 5,
    "open_restaurants": 4,
    "average_rating": 4.2,
    "restaurants_by_type": {
      "VIETNAMESE": 3,
      "FAST_FOOD": 2
    },
    "restaurants_by_city": {
      "Hà Nội": 3,
      "TP.HCM": 2
    }
  }
}
```

## 🔗 Integration với Catalog Service

### Link Menu Item với Catalog
```javascript
// Khi tạo menu item, có thể link với catalog
{
  "catalog_item_id": "catalog-uuid", // Reference to catalog service
  "name": "Phở Bò Tái",
  // ... other fields
}
```

### Sync với Catalog
- Menu items có thể reference catalog items
- Catalog service cung cấp standardized food data
- Partner service override pricing và customization
- Inventory tracking independent của catalog

## 🧪 Testing

### Unit Tests
```zsh
npm test
```

### API Testing với Postman
```javascript
// Test restaurant search
pm.test("Restaurant search returns results", function () {
    pm.response.to.have.status(200);
    pm.expect(pm.response.json().data).to.be.an('array');
});
```

### Sample Data
Database được populate với sample data:
- 3 sample partners
- 1 sample restaurant (Phở Cổ Truyền)
- 1 sample menu item (Phở Bò Tái)
- 1 sample promotion (20% discount)
- 1 sample inventory item

## 📱 Mobile App Integration

### Restaurant Discovery
```javascript
// Mobile app có thể search restaurants
GET /api/restaurants/search?latitude=21.0285&longitude=105.8542&radius=5

// Get restaurant menu
GET /api/restaurants/{restaurantId}/menu?status=AVAILABLE
```

### Real-time Updates
- Restaurant status changes (OPEN/CLOSED)
- Menu item availability
- Promotion activation/deactivation
- Inventory-based menu updates

## 🚧 Development

### Code Structure Guidelines
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic và database operations
- **Models**: Define data structures và types
- **Middleware**: Handle authentication, validation, error handling

### Best Practices
- ✅ Validate all input data
- ✅ Use transactions for complex operations
- ✅ Implement proper error handling
- ✅ Log important business events
- ✅ Use indexes for search optimization
- ✅ Implement rate limiting for partner registration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/restaurant-enhancement`
3. Commit changes: `git commit -am 'Add restaurant management feature'`
4. Push to branch: `git push origin feature/restaurant-enhancement`
5. Create Pull Request

## 📞 Support

Nếu có vấn đề hoặc câu hỏi:
- 📧 Email: support@uth-oop-project.com
- 🐛 Issues: GitHub Issues
- 📖 Docs: [Partner Service Documentation](./DOCS.md)

---

**Partner Service** - Complete restaurant and partner management solution for food delivery platforms 🏪✨