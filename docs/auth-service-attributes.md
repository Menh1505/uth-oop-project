# Bảng Thuộc Tính Auth Service

Tài liệu này liệt kê các thuộc tính quan trọng trong Auth Service để bạn tra cứu nhanh khi làm việc với cơ sở dữ liệu hoặc API. Nguồn tham chiếu chính: `backend/auth-service/src/models/User.ts`, `src/services/authService.ts` và các utils liên quan.

---

## 1. User Model (`src/models/User.ts`)

| Trường | Kiểu dữ liệu | Mô tả |
| --- | --- | --- |
| `_id` | ObjectId | Khoá chính MongoDB. |
| `email` | string (unique, lowercase) | Email đăng nhập, dùng làm định danh chính. |
| `username` | string? | Alias/username cho user (đôi khi dùng cho admin login). |
| `password_hash` | string? | Băm mật khẩu (có thể null với tài khoản social). |
| `status` | `"active" \| "inactive" \| "suspended"` | Trạng thái tài khoản. |
| `is_active` | boolean (default true) | Cờ hoạt động nhanh. |
| `email_verified` | boolean | Cho biết email đã xác thực chưa. |
| `login_methods` | string[] (enum email/google/facebook/apple) | Các phương thức đăng nhập đã liên kết. |
| `google_id` | string? (sparse unique) | UID từ Google/Firebase. |
| `google_email` | string? | Email do Google trả về (nếu khác). |
| `google_verified_at` | Date? | Thời điểm Google xác thực user. |
| `last_login` | Date? | Lần đăng nhập gần nhất. |
| `profile_picture_url` | string? | URL avatar (có thể lấy từ Google). |
| `created_at` | Date | Timestamp Mongo tự động. |
| `updated_at` | Date | Timestamp Mongo tự động. |

**Index chính**: `email`, `username`, `google_id`, `login_methods`.

---

## 2. Session Model (`src/models/User.ts`)

| Trường | Kiểu dữ liệu | Mô tả |
| --- | --- | --- |
| `_id` | ObjectId | Khoá chính MongoDB. |
| `user_id` | ObjectId (ref User) | Liên kết đến user. |
| `refresh_token_hash` | string | Băm refresh token (bcrypt). |
| `user_agent` | string? | UA khi tạo session. |
| `ip` | string? | Địa chỉ IP. |
| `login_method` | `"email" \| "google" \| "facebook" \| "apple"` | Phương thức tạo session. |
| `expires_at` | Date | TTL của refresh token. |
| `created_at` | Date | Timestamp tạo session. |

**Index**: `user_id`, TTL index trên `expires_at`.

---

## 3. TokenBlacklist Model (`src/models/User.ts`)

| Trường | Kiểu dữ liệu | Mô tả |
| --- | --- | --- |
| `_id` | ObjectId | Khoá chính. |
| `token_hash` | string (unique) | Băm access token đã thu hồi. |
| `user_id` | ObjectId? | User sở hữu token (nếu xác định được). |
| `expires_at` | Date | Thời điểm token hết hạn. |
| `blacklisted_at` | Date | Timestamp đưa vào blacklist. |

**Index**: TTL trên `expires_at`, unique `token_hash`.

---

## 4. Identity Model (`src/models/User.ts`)

| Trường | Kiểu dữ liệu | Mô tả |
| --- | --- | --- |
| `_id` | ObjectId | Khoá chính. |
| `user_id` | ObjectId (ref User) | Người dùng liên kết. |
| `provider` | string | Tên nhà cung cấp (vd: `google`). |
| `provider_uid` | string (unique) | UID do provider cung cấp. |
| `meta` | Mixed JSON | Dữ liệu bổ sung (email, name, picture). |
| `created_at` | Date | Timestamp tạo bản ghi. |

**Index**: `(provider, provider_uid)` unique, `user_id`.

---

## 5. Payload & Bộ Đệm (`src/types/auth.ts`, `src/services/cacheService.ts`)

| Đối tượng | Thuộc tính | Mô tả |
| --- | --- | --- |
| `CachedAuthUserPayload` | `user`, `roles`, `cachedAt` | Payload người dùng lưu trên Redis. |
| Redis key | `auth:user:<identifier>` | `<identifier>` là email/username viết thường. TTL mặc định `AUTH_USER_CACHE_TTL` (600 giây). |

---

## 6. Kết quả Đăng Nhập (`AuthService.login*`)

| Thuộc tính | Kiểu | Mô tả |
| --- | --- | --- |
| `access_token` | string (JWT) | Token truy cập (signAccess). |
| `expires_at` | number (ms) | Epoch time hết hạn access token. |
| `refresh_token` | string | Token làm mới (gửi cookie HttpOnly & trả về JSON). |

Các endpoint `login`, `adminLogin`, `loginWithGoogle`, `refresh` đều trả object tương tự.

---

## 7. Environment Quan Trọng

| Biến | Vai trò |
| --- | --- |
| `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` | Cấu hình ký JWT (trong `src/config/jwt.ts`). |
| `REFRESH_TTL_SEC` | TTL refresh token (mặc định 30 ngày). |
| `COOKIE_SECURE` | Bật secure cho cookie refresh. |
| `AUTH_USER_CACHE_TTL` | TTL cache Redis. |
| `FIREBASE_*` | Config verify Google ID token. |

---

## 8. Quan Hệ Tổng Quan

- `AuthController` gọi `AuthService` để thao tác mô hình ở trên.
- `AuthService` ghi log sự kiện qua `MessageService` (RabbitMQ).
- `UserService` và các service khác tiêu thụ sự kiện và dùng JWT để xác thực request.

Dựa vào bảng trên, bạn có thể kiểm tra nhanh mỗi trường trong Auth Service khi làm việc với database hoặc viết API.

