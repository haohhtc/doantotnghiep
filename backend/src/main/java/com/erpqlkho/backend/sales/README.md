# Module: Sales (Quản lý bán hàng)

Chức năng: SALE-01..SALE-05.

Entity chính: `Customer`, `SalesOrder` (customerId, warehouseId, status: PENDING/CONFIRMED/CANCELLED, totalAmount), `SalesOrderDetail` (salesOrderId, productId, quantity, unitPrice).

**Lưu ý nghiệp vụ quan trọng:** khi xác nhận đơn (`PUT /api/sales-orders/{id}/confirm`) phải trong 1 `@Transactional` — kiểm tra đủ tồn kho cho từng dòng → trừ `stock.quantity` → ghi `stock_transaction` (type=OUT). Không đủ tồn ở bất kỳ dòng nào → rollback toàn bộ, trả lỗi rõ ràng cho người dùng.

Cấu trúc cần code (theo pattern mẫu ở `auth/` + `user/`): `entity/`, `repository/`, `service/`, `controller/`, `dto/`.
