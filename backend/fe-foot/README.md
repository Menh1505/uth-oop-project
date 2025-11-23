# 🥗 FitFood – Nền tảng AI về Sức khỏe & Dinh dưỡng

**FitFood** là ứng dụng hiện đại được xây dựng bằng **React + TypeScript** trên nền **Vite 6** và **Tailwind CSS v4**.
Ứng dụng cung cấp khả năng theo dõi bữa ăn cá nhân hóa, gợi ý dinh dưỡng dựa trên AI, và quản lý đơn hàng theo thời gian thực.

---

## 🚀 Tính năng chính

* **Onboarding người dùng**: chọn mục tiêu, chế độ ăn, ngân sách, thời gian nấu ăn
* **Nhật ký bữa ăn & luyện tập**: thêm nhanh hoặc quét mã vạch/hình ảnh
* **Gợi ý AI**: đề xuất món ăn & bài tập 30 phút phù hợp
* **Phân tích dinh dưỡng**: theo dõi calo, protein, carb, fat theo ngày/tuần
* **Luồng đặt món**: duyệt menu → giỏ hàng → thanh toán → trạng thái đơn hàng
* **Thanh toán**: tích hợp Apple Pay (iOS) & PayOS (Android)
* **Cập nhật trạng thái đơn hàng theo thời gian thực**: pending → confirmed → preparing → delivering → completed

---

## 🧱 Kiến trúc dự án

```
fe-fitfood/
├── public/                # Tài nguyên tĩnh (hình ảnh, icon...)
├── src/
│   ├── components/        # Các thành phần UI tái sử dụng
│   │   ├── layout/        # Header, Navigation, Shell, Container
│   │   ├── ui/            # Buttons, Inputs, Cards, Tables
│   │   └── charts/        # (tùy chọn) Biểu đồ phân tích dinh dưỡng
│   │
│   ├── modules/           # Cấu trúc module theo tính năng
│   │   ├── auth/          # Đăng nhập OAuth2, mock auth context
│   │   ├── onboarding/    # Thiết lập hồ sơ người dùng (mục tiêu, chế độ ăn...)
│   │   ├── journal/       # Logic nhật ký ăn uống và tập luyện
│   │   ├── ai/            # Giao diện gợi ý AI (tích hợp Gemini API)
│   │   ├── analytics/     # Trang thống kê tổng hợp tuần
│   │   ├── menu/          # Duyệt menu & giỏ hàng
│   │   ├── checkout/      # Thanh toán & tạo đơn hàng
│   │   └── order/         # Theo dõi trạng thái đơn hàng
│   │
│   ├── routes/            # Định nghĩa tuyến đường React Router
│   ├── store/             # Trạng thái toàn cục (Zustand/Context)
│   ├── types/             # Kiểu dữ liệu TypeScript dùng chung
│   ├── data/              # Dữ liệu giả lập hoặc helper API
│   ├── index.css          # Cấu hình Tailwind v4 với chủ đề tuỳ chỉnh
│   └── main.tsx           # Điểm khởi chạy React
│
├── tailwind.config.ts     # (Tuỳ chọn) Cấu hình Tailwind v4 plugin mode
├── vite.config.ts         # Cấu hình Vite + plugin @tailwindcss/vite
├── tsconfig.json          # Cấu hình TypeScript
├── package.json           # Thông tin phụ thuộc và scripts
└── README.md
```

---

## 🎨 Giao diện & Thiết kế

FitFood sử dụng **Tailwind CSS v4** với cấu hình **CSS-first**.
Tất cả biến thiết kế (font, bo góc, màu sắc, animation) được khai báo trong `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --font-display: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --radius-xl2: 1.25rem;
  --color-brand: #4f46e5;
}
```

Áp dụng qua `@apply`:

```css
body { @apply font-display bg-white text-gray-900 antialiased; }
.btn-primary { @apply bg-brand text-white rounded-xl2 hover:bg-indigo-700; }
```

---

## ⚙️ Cài đặt & Phát triển

```bash
# 1. Cài đặt phụ thuộc
npm install

# 2. Chạy môi trường phát triển
npm run dev

# 3. Build cho production
npm run build

# 4. Xem trước bản build
npm run preview
```

Ứng dụng chạy tại: [http://localhost:5173](http://localhost:5173)

---

## 🧩 Công nghệ sử dụng

| Layer                  | Stack                                         |
| ---------------------- | --------------------------------------------- |
| **Frontend Framework** | React 18 + TypeScript                         |
| **Bundler/Dev Server** | Vite 6                                        |
| **Styling**            | Tailwind CSS v4 (@tailwindcss/vite)           |
| **Routing**            | React Router v6                               |
| **State Management**   | React Context / Zustand                       |
| **AI Integration**     | Gemini API (phân tích & gợi ý dinh dưỡng)     |
| **Payments**           | Apple Pay & PayOS                             |
| **Backend (API)**      | .NET hoặc FastAPI (tuỳ môi trường triển khai) |

---

## 🧠 Nguyên tắc thiết kế

* **Kiến trúc module hóa** – mỗi tính năng nằm trong thư mục riêng `src/modules/*`
* **UI hướng component** – các phần tử (layout, form, table, step) tái sử dụng tối đa
* **Luồng dữ liệu an toàn** – mọi thực thể (`UserProfile`, `Order`, `MealLog`) được định nghĩa trong `src/types/`
* **Thiết kế API-first** – giao tiếp với backend qua REST/GraphQL; dễ thay thế mock data
* **Theme Tailwind** – định nghĩa biến trong `@theme`, không cần sửa file `tailwind.config.js`

---

## 🧭 Hướng phát triển tương lai

* Kết nối **Gemini API thật** để phân tích món ăn động
* Kích hoạt **WebSocket** cho cập nhật trạng thái đơn hàng realtime
* Tích hợp **PayOS SDK** thực tế
* Thêm **biểu đồ trực quan** (Recharts / Chart.js)
* **Dockerize** toàn bộ app để triển khai sản xuất

---

## 💡 Ghi chú của tác giả

Dự án này minh họa cấu trúc **React + Vite + Tailwind v4** sẵn sàng cho sản xuất.
Mỗi module được tách biệt để mở rộng quy mô dễ dàng – có thể chuyển thành SaaS hoàn chỉnh bằng cách kết nối API thật và thêm middleware xác thực.

**License:** MIT © 2025 FitFood Team
Made with 💚
