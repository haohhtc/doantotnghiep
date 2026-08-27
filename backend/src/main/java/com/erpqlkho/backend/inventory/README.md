# Module: Inventory (Quản lý tồn kho)

Chức năng: INV-01..INV-05.

Entity chính:
- `Stock` — tồn hiện tại (unique theo productId × warehouseId)
- `StockTransaction` — lịch sử mọi biến động (IN/OUT/ADJUST), có `referenceType` + `referenceId` trỏ về nguồn gốc (goods_receipt / sales_order / stock_take)
- `StockTake`, `StockTakeDetail` — phiếu kiểm kê, so sánh hệ thống vs thực tế
- `StockAlert` — ngưỡng cảnh báo sắp hết hàng theo productId × warehouseId

**Bất biến cần giữ:** `stock.quantity` luôn phải bằng tổng các `stock_transaction` liên quan — không sửa `stock` trực tiếp mà không ghi transaction log tương ứng.

INV-05 (cảnh báo sắp hết hàng) có thể kết hợp với AI Stock Risk (`ai-services/stock-risk/`) — gọi API `/stock-risk` để lấy đề xuất nhập thêm.

Cấu trúc cần code (theo pattern mẫu ở `auth/` + `user/`): `entity/`, `repository/`, `service/`, `controller/`, `dto/`.
