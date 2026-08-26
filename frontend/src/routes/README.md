# Routes

Đặt cấu hình `react-router-dom` tại đây (`AppRoutes.jsx`), map 1-1 với các folder trong `src/pages/`:

| Route | Page |
|---|---|
| `/login` | `pages/auth/` |
| `/products` | `pages/category/Product/` |
| `/product-categories` | `pages/category/ProductCategory/` |
| `/suppliers` | `pages/category/Supplier/` |
| `/warehouses` | `pages/category/Warehouse/` |
| `/goods-receipts` | `pages/inbound/GoodsReceipt/` |
| `/sales-orders` | `pages/sales/SalesOrder/` |
| `/stock` | `pages/inventory/Stock/` |

Bọc các route (trừ `/login`) trong 1 `ProtectedRoute` kiểm tra JWT token còn hạn hay không.
