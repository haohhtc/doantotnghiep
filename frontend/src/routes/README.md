# Routes

`AppRoutes.jsx` dùng `react-router-dom` + `AppLayout` (sidebar Ant Design), map 1-1 với `src/pages/`:

| Route | Page | Ghi chú |
|---|---|---|
| `/login` | `pages/Login/` | Không bọc `ProtectedRoute` |
| `/` | `PlaceholderPage` | Trang chủ - chưa code UI thật (chưa có dashboard) |
| `/products` | `pages/category/Product/` | API thật |
| `/product-categories` | `pages/category/ProductCategory/` | API thật |
| `/vendors` | `pages/vendors/` | API thật (gọi `/api/suppliers`) |
| `/warehouses` | `pages/warehouses/` | API thật |
| `/customers` | `pages/customers/` | API thật |
| `/uoms` | `pages/uoms/` | Mock 100% - chưa có bảng UOM riêng trong schema |
| `/goods-receipts` | `pages/inbound/GoodsReceipt/` | API thật |
| `/sales-orders` | `pages/sales/SalesOrder/` | API thật |
| `/inventory/inventories` | `pages/inventory/Inventories/` | API thật (báo cáo tồn kho) |
| `/inventory/goods-issue` | `pages/inventory/GoodsIssue/` | Mock 100%, không có backend (ngoài phạm vi - xem quyết định trong lịch sử trao đổi) |
| `/inventory/transfer` | `pages/inventory/Transfer/` | Mock 100%, không có backend (ngoài phạm vi) |
| `/inventory/stock-counting` | `pages/inventory/StockCounting/` | API thật |
| `/inventory/stock-alerts` | `pages/inventory/StockAlerts/` | API thật (INV-05) |
| `/users` | `pages/system/Users/` | API thật - chỉ role `ADMIN` truy cập được |
| `/roles` | `pages/system/Roles/` | API thật - chỉ role `ADMIN` truy cập được |

## Bảo vệ route (`ProtectedRoute.jsx`)

- Mọi route trừ `/login` đều bọc trong `<ProtectedRoute />` - chặn về `/login` nếu chưa có `token` trong `localStorage`.
- `/users` và `/roles` bọc thêm 1 lớp `<ProtectedRoute allowedRoles={['ADMIN']} />` lồng bên trong - nếu role hiện tại không phải `ADMIN` thì hiện `ForbiddenPage` (403) thay vì render trang.
- Menu tương ứng (`AppLayout.jsx`) cũng ẩn "Người dùng"/"Phân quyền" khỏi role không phải `ADMIN`.

**Còn thiếu:** `ProtectedRoute` mới chỉ kiểm tra "có token hay không", chưa decode JWT để kiểm tra token còn hạn hay không khi vào trang - token hết hạn vẫn cho vào, chỉ khi gọi API mới bị 401 và bị đăng xuất (qua interceptor trong `api/axiosClient.js`).
