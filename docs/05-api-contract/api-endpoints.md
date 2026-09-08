# API Contract

## Quy ước chung

- Base path backend: `/api`
- Response bao bọc chuẩn (xem `ApiResponse.java`):
```json
{ "success": true, "message": "OK", "data": { } }
```
- Lỗi trả về HTTP status tương ứng (400/401/403/404/500) + `message` mô tả.
- Auth: header `Authorization: Bearer <JWT>` cho mọi endpoint trừ `/api/auth/login`.

## Backend — Auth & User `[BE1]`

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/login` | Đăng nhập, trả JWT |
| POST | `/api/auth/logout` | Đăng xuất |
| GET | `/api/users` | Danh sách người dùng |
| POST | `/api/users` | Tạo người dùng |
| PUT | `/api/users/{id}` | Cập nhật người dùng |
| DELETE | `/api/users/{id}` | Xóa/khóa người dùng |

## Backend — Danh mục `[BE1]`

| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/products` `/api/products/{id}` | CRUD sản phẩm |
| GET/POST/PUT/DELETE | `/api/product-categories` `/{id}` | CRUD danh mục sản phẩm |
| GET/POST/PUT/DELETE | `/api/suppliers` `/{id}` | CRUD nhà cung cấp |
| GET/POST/PUT/DELETE | `/api/warehouses` `/{id}` | CRUD kho |

## Backend — Nhập hàng / Bán hàng / Tồn kho `[BE1]`

| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/goods-receipts` | Danh sách / tạo phiếu nhập |
| GET | `/api/goods-receipts/{id}` | Chi tiết phiếu nhập |
| GET/POST | `/api/sales-orders` | Danh sách / tạo đơn hàng |
| PUT | `/api/sales-orders/{id}/confirm` | Xác nhận đơn → tự động xuất kho |
| PUT | `/api/sales-orders/{id}/cancel` | Hủy đơn |
| GET | `/api/stock` | Tồn kho hiện tại (filter theo product/warehouse) |
| GET | `/api/stock/transactions` | Lịch sử nhập/xuất/điều chỉnh |
| GET/POST | `/api/stock-takes` | Danh sách / tạo phiếu kiểm kê |
| PUT | `/api/stock-takes/{id}/approve` | Duyệt kiểm kê → ghi nhận chênh lệch |
| GET | `/api/stock/alerts` | Danh sách cảnh báo sắp hết hàng |

## Backend — Tuyến bán hàng & Chi nhánh `[BE1]`

Module theo yêu cầu TV2 (xem `tuyen-ban-hang-overview.html`) — migration `V10__branch_selling_zone_route.sql`.
Phân quyền: GET mở cho mọi role đã đăng nhập; POST/PUT/DELETE chỉ `ADMIN` + `WAREHOUSE_MANAGER`.

| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/branches` `/{id}` | CRUD chi nhánh (DELETE = ngừng hoạt động, không xóa hẳn) |
| GET/POST/PUT/DELETE | `/api/selling-zones` `/{id}` | CRUD vùng bán hàng (FK `branch_id`) |
| GET/POST/PUT/DELETE | `/api/route-masters` `/{id}` | CRUD khung tuyến (FK `selling_zone_id`, `branch_id`) |
| GET | `/api/route-masters/{id}/outlets` | Danh sách khách hàng trong khung tuyến |
| POST | `/api/route-masters/{id}/outlets` | Gán khách hàng vào khung tuyến — body `{ "customerId": 1 }` |
| DELETE | `/api/route-masters/{id}/outlets/{outletId}` | Gỡ khách hàng khỏi khung tuyến |
| GET/POST/PUT/DELETE | `/api/route-settings` `/{id}` | CRUD giao tuyến vận hành (FK `route_master_id`, `sales_person_id` → user) |

## AI Services `[BE2]` — được Backend hoặc Frontend gọi trực tiếp

| Service | Method | Endpoint | Input | Output |
|---|---|---|---|---|
| Forecasting (`:8001`) | POST | `/forecast` | `{ "productId": 1, "horizonDays": 7 }` | `{ "productId": 1, "predictions": [{"date": "...", "quantity": 12.5}, ...] }` |
| Stock Risk (`:8002`) | GET | `/stock-risk` | query `?warehouseId=` (optional) | `[{ "productId": 1, "currentStock": 20, "forecastDemand": 45, "riskLevel": "HIGH", "suggestedReorderQty": 30 }]` |
| Anomaly Detection (`:8003`) | GET | `/anomalies` | query `?from=&to=` | `[{ "date": "...", "productId": 1, "type": "OUT", "quantity": 500, "expectedRange": [10, 50], "severity": "HIGH" }]` |
| Chatbot (`:8004`) | POST | `/chat` | `{ "question": "Sản phẩm nào sắp hết hàng?" }` | `{ "answer": "...", "sourceData": [...] }` |

> Các service AI đọc dữ liệu từ **Data Warehouse**, không đọc trực tiếp OLTP (xem `docs/02-architecture/system-architecture.md`).

## Cập nhật hợp đồng API

Khi 1 trong 2 thành viên đổi request/response shape của 1 endpoint đang được bên kia dùng, **phải cập nhật file này trong cùng Pull Request** — đây là nguồn sự thật duy nhất cho tích hợp giữa 2 phần hệ thống.
