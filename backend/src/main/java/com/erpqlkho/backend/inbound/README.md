# Module: Inbound (Quản lý nhập hàng)

Chức năng: IN-01..IN-04 trong `docs/01-requirements/functional-requirements.md`.

Entity chính: `GoodsReceipt` (phiếu nhập: supplierId, warehouseId, createdBy, status, totalAmount) và `GoodsReceiptDetail` (goodsReceiptId, productId, quantity, unitPrice).

**Lưu ý nghiệp vụ quan trọng (xem `docs/03-database/erd-oltp.md`):** khi lưu phiếu nhập phải trong 1 `@Transactional` — lưu detail + cộng `stock.quantity` + ghi `stock_transaction` (type=IN) cùng lúc.

Cấu trúc cần code (theo pattern mẫu ở `auth/` + `user/`): `entity/`, `repository/`, `service/`, `controller/`, `dto/`.
