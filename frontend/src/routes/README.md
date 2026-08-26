# Routes

`AppRoutes.jsx` **đã dựng sẵn** — `react-router-dom` + `AppLayout` (sidebar Ant Design), map 1-1 với `src/pages/`:

| Route | Page |
|---|---|
| `/login` | `pages/auth/Login.jsx` |
| `/products` | `pages/category/Product/` |
| `/product-categories` | `pages/category/ProductCategory/` |
| `/suppliers` | `pages/category/Supplier/` |
| `/warehouses` | `pages/category/Warehouse/` |
| `/goods-receipts` | `pages/inbound/GoodsReceipt/` |
| `/sales-orders` | `pages/sales/SalesOrder/` |
| `/stock` | `pages/inventory/Stock/` |
| `/users` | `pages/system/Users/` |
| `/roles` | `pages/system/Roles/` |

Mỗi page hiện là `PlaceholderPage` (chỉ tiêu đề) — thay bằng UI thật (Table/Form Ant Design) khi code.

**Còn TODO:** bọc các route (trừ `/login`) trong 1 `ProtectedRoute` kiểm tra JWT token còn hạn hay không — hiện chưa có, ai cũng vào được mọi trang kể cả chưa đăng nhập.
