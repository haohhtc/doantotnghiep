# Tổng hợp những gì đã làm

Đối chiếu theo file `NGHIEP-VU-DMS-THAM-CHIEU.html` (5 nhóm module trong phạm vi đồ án: MDM, Inventory, Sales Order, Purchase Order, Quản trị).

## MDM (Danh mục)

| Nhóm (theo DMS) | Đã làm | Ghi chú |
|---|---|---|
| Geographical | ✅ | Region → Province → District → Ward, cascading dropdown, gắn vào SellingZone/Branch/Customer |
| Sales Organization | ✅ | Vùng bán hàng (Selling Zone). Sales Territory không tách bảng riêng — dùng chung Geography |
| Company Setup | ✅ | Công ty (singleton) → Chi nhánh → Kho, Nhà cung cấp |
| Product | ✅ | Sản phẩm, Nhóm sản phẩm (có phân cấp cha/con), Đơn vị tính + Nhóm quy đổi (UomGroup/UomConversion theo hệ số so với đơn vị gốc), Nhóm thuế, Item-Branch Assignment (2 chiều: theo sản phẩm và theo chi nhánh) |
| Price list | ✅ | Bảng giá (Standard/Channel/Contract), giá theo từng sản phẩm+đơn vị tính, API tra giá tự động (customer → branch → giá gốc), đã wiring vào Sales Order |
| Customers | ✅ | Hồ sơ khách hàng, Nhóm khách hàng, Kênh bán hàng (Account/Channel Definition) |
| Employees | ✅ | Chức vụ (Salesman/SS/ASM), Loại nhân viên bán hàng (Presell/Van Sales/Delivery) — dùng chung bảng `user`, không tách Employee riêng |
| Route & MCP | ✅ | Khung tuyến (Route Master) + Giao tuyến vận hành (Route Setting), gán outlet và salesman theo tuyến |

## Inventory (Kho)

| Nghiệp vụ | Đã làm | Ghi chú |
|---|---|---|
| Inventories (tồn kho hiện tại) | ✅ | |
| Goods Receipt (nhập kho, đã gộp Purchase Order) | ✅ | |
| Stock Counting (kiểm kê) | ✅ | |
| Stock Alerts (cảnh báo tồn thấp) | ✅ (backend) | Đã gỡ khỏi giao diện (chuông + menu) theo yêu cầu, backend/API/bảng DB vẫn giữ nguyên |
| Goods Issue (xuất kho) | ✅ | Màn hình thật riêng (không gộp vào Sales Order) — tạo phiếu → xác nhận → trừ tồn kho qua `StockService` |
| Inventory Transfer (điều chuyển kho) | ✅ | Tách 2 bước xác nhận thật giống DMS: "Chuyển hàng tồn kho" (kho nguồn xác nhận xuất, trừ tồn) → "Xác nhận di chuyển hàng tồn kho" (kho đích xác nhận nhận, cộng tồn). Trạng thái `DRAFT → IN_TRANSIT → CLOSED` |
| POSM Inventory | 🚫 Bỏ qua | Ngoài phạm vi — thuộc Trade Marketing, không phải nghiệp vụ tồn kho cốt lõi |

## Sales Order (Bán hàng)

✅ Đã gộp chuỗi Sales Request → Sale Order → Delivery Order thành 1 bảng `sales_order`, xác nhận đơn = xuất kho luôn. Tự động tra giá qua Price List khi chọn sản phẩm.

## Purchase Order (Mua hàng)

✅ Đã gộp vào Goods Receipt (không tách phiếu yêu cầu mua hàng riêng).

## Quản trị

✅ Users (kèm Chi nhánh/Chức vụ/Loại NVBH), Roles/Permissions.

## Hạ tầng chung

- RBAC 3 role: ADMIN, WAREHOUSE_MANAGER, SALES_STAFF — phân quyền theo từng nhóm API trong `SecurityConfig`.
- Hard-delete (xóa thật) thay cho soft-delete ở các danh mục chính (theo yêu cầu tạm thời).
- Sidebar tổ chức theo submenu bám sát cấu trúc module DMS: Vùng địa lý, Sales Organization, Company Setup, Sản phẩm, Bảng giá, Khách hàng, Route & MCP, Nhân viên, Tồn kho, Hệ thống.
- "Nhập hàng" đã chuyển từ mục riêng ngoài Sidebar vào trong nhánh "Tồn kho" (đứng ngay sau "Báo cáo tồn kho") — route `/goods-receipts` giữ nguyên.
- Đã xóa hẳn nút "Tạo yêu cầu mua hàng" (mock, không có API thật) khỏi trang Báo cáo tồn kho.

## Chưa làm / ngoài phạm vi

- Returns/Credit Memo (DMS gợi ý nên giữ ít nhất 1 chiều, chưa làm).
- POSM Inventory — thuộc Trade Marketing, chủ động bỏ.
- Batch Management, Invoices, Promotions, Branch User Assignment — chủ động bỏ theo bảng đối chiếu trong file DMS reference (không nằm trong phạm vi đồ án).

## Cách test Goods Issue (Phiếu xuất kho) và Inventory Transfer (Điều chuyển kho)

**Goods Issue** (`/inventory/goods-issue`):
1. Bấm "+" tạo phiếu mới → chọn Kho xuất, Lý do xuất → thêm ít nhất 1 dòng sản phẩm (chọn sản phẩm đang có tồn kho + số lượng) → Lưu.
2. Phiếu hiện trạng thái "Nháp" → bấm nút dấu tích (✓) để Xác nhận.
3. Kiểm tra: trạng thái chuyển "Đã xuất", vào trang Tồn kho > Báo cáo tồn kho để thấy số lượng sản phẩm đó đã giảm đúng bằng số lượng vừa xuất.
4. Test chặn thiếu hàng: tạo phiếu xuất số lượng lớn hơn tồn kho hiện có → khi Xác nhận sẽ báo lỗi, không cho trừ âm.

**Inventory Transfer** (2 bước, 2 trang riêng):
1. Vào "Chuyển hàng tồn kho" (`/inventory/transfer`) → tạo phiếu mới, chọn Kho đi / Kho đến (khác nhau) + sản phẩm + số lượng → Lưu.
2. Bấm Xác nhận (✓) trên phiếu vừa tạo → trạng thái chuyển "Đang vận chuyển", tồn kho **nguồn** giảm ngay, kho đích **chưa** tăng (đúng như thật — hàng đang trên đường).
3. Vào "Xác nhận di chuyển hàng tồn kho" (`/inventory/transfer-confirmation`) → sẽ thấy phiếu vừa tạo ở trạng thái "Đang vận chuyển" → bấm "Xác nhận nhận hàng".
4. Kiểm tra: trạng thái chuyển "Đã nhận hàng", tồn kho **kho đích** tăng đúng số lượng, tổng tồn kho toàn công ty không đổi.

Đã test đủ 2 luồng trên qua API thật (không phải đoán) trước khi bàn giao — số liệu tồn kho và `stock_transaction` khớp chính xác ở mọi bước, kể cả trường hợp chặn xác nhận lại 1 phiếu đã đóng.
