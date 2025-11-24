# Tổng Quan Kiến Trúc LCUS

Tài liệu này tóm tắt kiến trúc hệ thống hiện tại để bạn có thể sao chép thẳng vào Confluence. Các sơ đồ PlantUML nằm trong thư mục `docs/` (gateway, auth flow, Google login, class diagram, use case) và được tham chiếu ở cuối.

---

`qqqqqqqqqswaqqqqqqqqqqqqqqqqqqqq`

- **Đối tượng phục vụ**: Người dùng nền tảng LCUS theo dõi bữa ăn, luyện tập và mục tiêu qua ứng dụng React SPA.
- **Triển khai**: Các dịch vụ vi mô chạy trên Docker và nằm sau Nginx gateway (`backend/nginx/nginx.conf`). Mỗi service phơi REST API ở cổng riêng và liên lạc qua Docker DNS (`resolver 127.0.0.11`).
- **Lưu trữ chính**: MongoDB riêng cho từng service, Redis cache dành cho payload người dùng (auth), RabbitMQ truyền sự kiện user lifecycle, cùng bộ nhớ file/object cho avatar.
- **Luồng chính**:
  1. Đăng nhập người dùng (email/password hoặc Google Firebase).
  2. Hoàn tất hồ sơ và cập nhật thông tin cá nhân.
  3. Quản lý mục tiêu (goal) và đánh giá tiến độ.
  4. Ghi nhật ký bữa ăn, bài tập và tổng hợp thống kê.
  5. Đồng bộ dữ liệu giữa các service thông qua sự kiện.

Tham chiếu sơ đồ: `docs/nginx-load-balance.puml`, `docs/auth.puml`, `docs/google-login-flow.puml`, `docs/services-class-diagram.puml`, `docs/usecases.puml`.

---

## Lớp Giao Diện & Xác Thực

### Frontend (`fe-foot`)
- Ứng dụng React, gọi API thông qua prefix `/api/*` đã được Nginx proxy.
- Trạng thái cục bộ quản lý bởi `AppStore` (đăng nhập, đăng xuất, onboarding, giỏ hàng, gọi `/api/users/me` để lấy hồ sơ).
- Hai kênh đăng nhập:
  - **Email/Password** qua `/api/auth/login`.
  - **Google/Firebase** sử dụng `GoogleLoginButton` (signInWithPopup → idToken → `/api/auth/google-login`).

### Auth Service (`backend/auth-service`)
- Cung cấp endpoint: register, login, google-login, admin login, refresh, logout, danh sách session, blacklist token.
- Mô hình MongoDB: `User`, `Session`, `TokenBlacklist`, `Identity` (`src/models/User.ts`).
- Access token là JWT; refresh token là chuỗi opaque được hash và lưu cùng metadata (UA, IP, login method).
- Redis cache (`cacheService.ts`) lưu payload user để middleware `userCacheMiddleware` tra nhanh khi đăng nhập.
- RabbitMQ (`MessageService.ts`) phát sự kiện `user.registered`, `user.logged_in`, `user.logged_out` cho các service khác.
- Xem `docs/auth.puml` để rõ luồng login/refresh/logout và `docs/google-login-flow.puml` cho flow với Firebase.

### Hành Vi Token/Session
- Refresh token được xoay vòng trong `/api/auth/refresh`, session cũ bị xoá để tránh tái sử dụng.
- Access token có thể bị đưa vào blacklist khi logout: token được hash và lưu, quá trình verify kiểm tra blacklist trước khi validate JWT.
- SPA lưu `accessToken`/`authToken`, `refreshToken` và `loginMethod` trong `localStorage`.

---

## API Gateway (`backend/nginx/nginx.conf`)

- Lắng nghe HTTP 80, có `/health`, forward các header `X-Forwarded-*`, giới hạn `client_max_body_size`.
- Rewrite `/api/<service>/*` rồi proxy đến cổng container:
  - `/api/auth` → Auth Service :3001
  - `/api/users` → User Service :3002
  - `/api/admin` → Admin Service :3003
  - `/api/meals` → Meal Service :3004
  - `/api/exercises` → Exercise Service :3005
  - `/api/goals` → Goal Service :3006
- Các route Recommendation/Payment đã được comment sẵn cho tương lai.
- Sơ đồ `docs/nginx-load-balance.puml` minh hoạ tổng quan gateway.

---

## Các Dịch Vụ Cốt Lõi

### User Service (`backend/user-service`)
- Endpoint: `/users/me`, cập nhật profile, hoàn tất onboarding, quản lý goals, dashboards, upload avatar.
- MongoDB riêng (`user_db`). Nếu validate JWT hợp lệ mà chưa có record thì sẽ tạo mới.
- Nghe sự kiện từ Auth Service để enrich dữ liệu, hỗ trợ build public avatar URL qua Nginx.

### Meal Service (`backend/meal-service`)
- Quản lý meal log, cập nhật, xóa, thống kê hằng ngày.
- Liên kết Goal Service qua `GoalServiceClient` để so khớp mục tiêu dinh dưỡng.
- Theo pattern repository (`MealRepository`) để tách logic Mongo.

### Exercise Service (`backend/exercise-service`)
- CRUD bài tập, summary theo ngày, thống kê, gợi ý dựa trên `exerciseTemplates`.
- Tính toán weekly summary, most common exercises, performance metrics.

### Goal Service (`backend/goal-service`)
- Quản lý goal template và user goal: tạo/sửa/xoá, assign cho user, theo dõi tiến độ, thống kê, gợi ý intelligent.
- Mô hình tách Goal (template) và UserGoal (bản gán) dùng UUID.
- Hỗ trợ lọc/paginate, cảnh báo deadline, tạo goal từ template, gợi ý SMART.

### Admin Service
- Expose `/api/admin`, dùng cho dashboard quản trị, dựa trên luồng đăng nhập admin của Auth Service.

---

## Dữ Liệu & Messaging

| Thành phần | Vai trò |
| --- | --- |
| **MongoDB (mỗi service)** | Tách riêng domain để tránh coupling; ví dụ Auth lưu credential/session, User lưu profile, Meal/Exercise/Goal lưu log và mục tiêu. |
| **Redis** | Cache payload user cho luồng login; có thể mở rộng caching profile trong tương lai. |
| **RabbitMQ** | Truyền sự kiện user lifecycle tới các service cần phân tích/notify. |
| **Firebase Auth** | Cung cấp Google ID token, tận dụng xác thực của Google. |

---

## Luồng Chính & Use Case

1. **Đăng nhập email** – theo `docs/auth.puml`: user gửi credential → Auth Service phát JWT + refresh token → SPA lưu token → gọi `/api/users/me`.
2. **Đăng nhập Google** – theo `docs/google-login-flow.puml`: SPA nhận Firebase ID token → backend verify → tạo user nếu cần → phát token → fetch profile.
3. **Hoàn tất hồ sơ** – App dẫn user chưa có profile qua onboarding; cập nhật gọi `/api/users/me`.
4. **Theo dõi mục tiêu** – User duyệt catalog, assign goal, cập nhật tiến độ; Meal/Exercise feeds cung cấp dữ liệu cho gợi ý.
5. **Quản lý session/token** – User/admin có thể xem session hiện tại, revoke và logout để blacklist token.

Sơ đồ use case đầy đủ nằm ở `docs/usecases.puml`.

---

## Triển Khai & Vận Hành

- **Biến môi trường**: mỗi service có `.env` hoặc config riêng (JWT secret/audience, Mongo URI, Redis, RabbitMQ, Firebase). Auth Service sử dụng `COOKIE_SECURE`, `REFRESH_TTL_SEC`, cấu hình Firebase.
- **Health check**: từng service có `/status` hoặc `/health` liệt kê metadata và endpoint; Nginx proxy lại.
- **Quan sát**: Nginx log định dạng tuỳ chỉnh (`rt`, `urt`). Các service log ra stdout để gom tập trung.
- **Khả năng mở rộng**:
  - Service stateless (auth, goal, exercise, meal, user) scale ngang; session lưu ở Mongo.
  - Nginx có thể load-balance nhiều replica bằng upstream.
  - RabbitMQ giúp decouple consumer.

---

## Tham Chiếu Sơ Đồ

| Sơ đồ | Đường dẫn | Nội dung |
| --- | --- | --- |
| Gateway Map | `docs/nginx-load-balance.puml` | Routing của Nginx và upstream. |
| Auth Login Sequence & Entities | `docs/auth.puml` | Luồng email/password và mô hình dữ liệu auth. |
| Google Login Sequence | `docs/google-login-flow.puml` | Luồng Firebase từ client đến backend. |
| Service Class Diagram | `docs/services-class-diagram.puml` | Quan hệ controller/service/model chính. |
| Use Case Diagram | `docs/usecases.puml` | Visitor/User/Admin và các tính năng tương ứng. |

Có thể nhúng trực tiếp trên Confluence bằng macro PlantUML hoặc xuất ảnh PNG/SVG.

---

## Định Hướng Tiếp Theo

- **Bảo mật**: đảm bảo HTTPS trước Nginx, bật `secure` cho cookie sản xuất, xây dựng quy trình xoay JWT secret.
- **Cache Strategy**: mở rộng Redis cho profile cache, định nghĩa rõ chiến lược invalidation.
- **Event Consumer**: ghi lại service nào đang consume RabbitMQ, bổ sung tài liệu Goal/Meal/Exercise sử dụng event ra sao.
- **Monitoring**: bổ sung dashboard cho login success rate, refresh token, health endpoint.

Tài liệu này kèm các sơ đồ đi kèm tạo thành gói kiến trúc hoàn chỉnh, sẵn sàng để sao chép vào Confluence.

