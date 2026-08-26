# Frontend — ERP Quản Lý Kho Thông Minh

React (Vite). Giao diện tham khảo look & feel hệ thống DMS hiện có (sidebar theo module, bảng dữ liệu dạng grid) — thiết kế UI thực tế tự làm.

## Chạy thử

```bash
npm install
npm run dev      # http://localhost:5173
```

## Trạng thái scaffold

Chỉ mới dựng khung chạy được (Vite + React root render "hello"). Toàn bộ `pages/`, `components/`, `routes/` là **folder rỗng có README hướng dẫn** — tự code UI thật vào đây.

## Cấu trúc

```
src/
├── api/axiosClient.js   ← đã cấu hình sẵn base URL gọi Backend
├── pages/                ← 1 folder / 1 module, mirror với backend/
├── components/           ← xem README bên trong
└── routes/                ← xem README bên trong
```
