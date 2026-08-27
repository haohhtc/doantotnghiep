# Frontend — ERP Quản Lý Kho Thông Minh

React (Vite) + **Ant Design**. Giao diện tham khảo look & feel hệ thống DMS thật trong `../ui-reference/` (sidebar theo module, bảng dữ liệu dạng grid).

## Chạy thử

```bash
npm install
npm run dev      # http://localhost:5173
```

Đã chạy được thật: vào `/login` thấy form đăng nhập (chưa nối API), các route khác (`/products`, `/goods-receipts`...) hiển thị trong `AppLayout` (sidebar Ant Design đúng menu module) với nội dung placeholder.

## Trạng thái scaffold

| Phần | Trạng thái |
|---|---|
| `components/AppLayout.jsx`, `PlaceholderPage.jsx` | **Đã dựng, chạy được** |
| `routes/AppRoutes.jsx` | **Đã dựng** — router + map route↔page đầy đủ |
| `pages/**/index.jsx` | Placeholder (chỉ tiêu đề) — **tự code UI thật vào đây** theo mẫu ảnh trong `../ui-reference/` |
| `pages/auth/Login.jsx` | Có UI form, **chưa nối API** (`POST /api/auth/login`) |
| `api/axiosClient.js` | Đã cấu hình sẵn base URL gọi Backend |
| `ProtectedRoute` (chặn route khi chưa login) | **Chưa có** — TODO |

## Cấu trúc

```
src/
├── api/axiosClient.js
├── components/AppLayout.jsx, PlaceholderPage.jsx   ← xem README bên trong để biết còn thiếu gì
├── pages/                                            ← 1 folder / 1 module, mirror với backend/
└── routes/AppRoutes.jsx
```
