# Tổng hợp việc chuẩn bị làm

<details>
<summary>✅ / Module: Bảng giá (Price List) — ĐÃ XONG</summary>

Nguồn: file `NGHIEP-VU-DMS-THAM-CHIEU.html` — mục MDM > Price list: Price Lists · Standard/Channel/Contract Price.

### 1. Database Migration (V14)
- Bảng `price_list`: `id`, `code`, `name`, `type` (STANDARD, CHANNEL, CONTRACT — chỉ mang tính mô tả/nhãn, không tự đổi logic tra cứu), `start_date`, `end_date`, `is_active`.
- Bảng `price_list_item`: `id`, `price_list_id`, `product_id`, `uom_id`, `price`.
- Thêm `price_list_id` (FK, nullable) vào bảng `branch` và `customer`.

### 2. Backend Spring Boot
- CRUD API cho Price List (Header + Detail danh sách giá sản phẩm) — theo pattern nested list giống UomGroup ↔ UomConversion đã có.
- API tra cứu đơn giá tự động cho sản phẩm dựa trên Customer ID / Branch ID, thứ tự ưu tiên (mô phỏng Contract → Channel → Standard của DMS thật, đơn giản hóa):
  1. `customer.price_list_id` (nếu khách có gán bảng giá và sản phẩm có trong đó) → dùng giá này trước.
  2. Nếu không có → fallback qua `branch.price_list_id`.
  3. Nếu vẫn không có → fallback về `product.price` (field cũ hiện tại).

### 3. Frontend React (Ant Design)
- Submenu xổ xuống "Bảng giá" (icon 🏷️ TagOutlined) chứa trang Quản lý Bảng giá (`/price-lists`).
- Trang `/price-lists`: bảng danh sách Price List + Modal/Drawer nhập đơn giá sản phẩm (product + uom + price) thuộc Price List đó.
- Thêm Form.Item "Bảng giá" (Select) vào form Chi nhánh (`pages/branches`) và form Khách hàng (`pages/customers`) để gán `price_list_id` — nếu không có bước này thì FK sẽ luôn null, API tra giá không chạy đúng thực tế.
- Sửa trang Sales Order (`pages/sales/SalesOrder`): khi chọn khách hàng + sản phẩm trong dòng chi tiết, gọi API tra giá tự động thay vì lấy thẳng `product.price` như hiện tại (dòng 317 file đó) — để tính năng thật sự được "mix" vào luồng tạo đơn hàng, không bị cô lập.

### Trạng thái
- [x] Đã implement xong (Migration + Backend + Frontend), đã test qua API (login → CRUD → lookup), build frontend sạch. Đã up git.

</details>

<details>
<summary>✅ / Module: Khách hàng (Customer Group / Channel) — ĐÃ XONG</summary>

Nguồn: file `NGHIEP-VU-DMS-THAM-CHIEU.html` — mục MDM > Customers: Customer Profile · Group · Account/Channel Definition.

### 1. Database Migration (V15)
- Bảng `customer_group`: `id`, `code`, `name`, `description`.
- Bảng `customer_channel`: `id`, `code` (VD: GT/MT/HORECA), `name` (tên đầy đủ, VD "Kênh đại lý truyền thống"), `description`.
- Thêm FK `group_id` và `channel_id` (nullable) vào bảng `customer`.

### 2. Backend Spring Boot
- CRUD API cho CustomerGroup, CustomerChannel (pattern giống TaxGroup đã có).
- Cập nhật CustomerService/CustomerDto để nhận thêm `groupId`, `channelId`.

### 3. Frontend React (Ant Design)
- Gom Sidebar thành 1 Submenu xổ xuống "Khách hàng" (icon IdcardOutlined/UserOutlined) gồm 3 mục con:
  - Khách hàng → `/customers`
  - Nhóm khách hàng → `/customer-groups`
  - Kênh bán hàng → `/customer-channels`
- Cập nhật Form Thêm/Sửa Khách hàng (`pages/customers`): thêm 3 Dropdown — Nhóm khách hàng, Kênh bán hàng, Bảng giá áp dụng (Select bảng giá làm chung 1 lần ở đây, không sửa form 2 lần theo từng migration).

### Điểm đã chốt
- `price_list.type` (STANDARD/CHANNEL/CONTRACT) và `customer.channel_id` là 2 khái niệm **độc lập, không tự liên kết**. Admin vẫn phải tự tay gán `price_list_id` cho từng khách/chi nhánh, hệ thống không tự suy ra bảng giá theo channel của khách. Logic tra giá giữ đúng như đã chốt ở module Price List (customer → branch → product.price).
- Customer Group / Channel chỉ là dữ liệu mô tả/phân loại (hiển thị trên form Khách hàng), không có logic tính toán nào khác (không lọc report, không ảnh hưởng Sales Order) — giống cách TaxGroup/ProductCategory đang hoạt động.

### Trạng thái
- [x] Đã implement xong (Migration + Backend + Frontend), đã test qua API (login → CRUD → lookup), build frontend sạch. Đã up git.

</details>

<details>
<summary>✅ / Module: Nhân viên (Employee Position / Salesman Type) — ĐÃ XONG</summary>

Nguồn: file `NGHIEP-VU-DMS-THAM-CHIEU.html` — mục MDM > Employees: Employee Master Data · Salesman Type · Position.

Quyết định: **không tách Employee thành bảng riêng** — giữ nguyên dùng chung `User` (đơn giản hóa, giống các lần gộp khác trong project). Chỉ bổ sung Chức vụ, Loại NVBH và Chi nhánh làm việc thẳng vào `User` hiện có.

### 1. Database Migration (V16)
- Bảng `employee_position`: `id`, `code`, `name` (Salesman, SS, ASM...), `description`.
- Bảng `salesman_type`: `id`, `code`, `name` (Presell, Van Sales, Delivery...), `description`.
- `ALTER TABLE user` (số ít, đúng theo `User.java`) bổ sung: `position_id` (FK, nullable), `salesman_type_id` (FK, nullable), `branch_id` (FK, nullable).
- Seed dữ liệu mẫu chuẩn FMCG: Chức vụ (Salesman, SS, ASM), Loại NVBH (Presell, Van Sales, Delivery).

### 2. Backend Spring Boot
- CRUD API cho EmployeePosition và SalesmanType.
- Cập nhật `UserService`/`UserDto` hỗ trợ lưu/trả về `positionId`, `salesmanTypeId`, `branchId`.
- API `/api/branches/{id}/salesmen`: lọc `user.branch_id = {id} AND role.code = 'SALES_STAFF'`.

### 3. Frontend React (Ant Design)
- Submenu Sidebar "Nhân viên" (icon UserOutlined) gồm:
  - Nhân viên → trỏ về trang `/users` đã có sẵn (KHÔNG tạo route `/employees` riêng, tránh trùng dữ liệu với 1 record User bị sửa ở 2 nơi khác nhau).
  - Chức vụ → `/employee-positions`
  - Loại nhân viên bán hàng → `/salesman-types`
- Cập nhật Form Thêm/Sửa ở trang `/users` hiện có: thêm 3 Dropdown — Chi nhánh, Chức vụ, Loại NVBH.

### Trạng thái
- [x] Đã implement xong (Migration + Backend + Frontend), đã test qua API (login → CRUD → lookup), build frontend sạch. Đã up git.

</details>

## Module: Inventory — Goods Issue (V17) + Inventory Transfer (V18)

Nguồn: file `NGHIEP-VU-DMS-THAM-CHIEU.html` — mục Inventory (8 màn hình), đối chiếu với ảnh chụp DMS thật (`ui-reference/04-ton-kho/`).

Quyết định đã chốt cho cả nhóm Inventory (7 mục, bỏ POSM):
- **Inventories, Goods Receipt, Distributor Stock Counting**: ✅ đã xong từ trước, không đụng tới.
- **Goods Issue**: ban đầu định gộp vào Sales Order (theo ghi chú cũ trong file DMS), nhưng xem ảnh DMS thật thì đây là màn hình độc lập thật sự — quyết định **làm thật riêng** theo đúng cấu trúc ảnh, tận dụng UI mock có sẵn ở `/inventory/goods-issue`.
- **Inventory Transfer + Confirmation + Inventory Movement Confirmation**: gộp 3 thành 1 bước xác nhận duy nhất (giống cách đã đơn giản hóa Goods Receipt trước đây: gộp 2 bước Confirmation + Goods Receipt PO thành 1).
- **POSM Inventory**: bỏ qua — thuộc phạm vi Trade Marketing (đã bị loại từ đầu), không phải nghiệp vụ tồn kho cốt lõi.

### Module con 1: Goods Issue (Phiếu xuất kho) — Migration V17

**1. Database Migration (V17)**
- Bảng `goods_issue`: `id`, `doc_number` (auto-gen tiền tố `PX`, giống `PN` của Goods Receipt), `doc_date`, `posting_date`, `warehouse_id` (FK), `reason`, `remarks`, `status` (DRAFT/CLOSED), `created_by` (FK User), `created_at`, `updated_at`.
- Bảng `goods_issue_item`: `id`, `goods_issue_id` (FK), `product_id` (FK), `quantity`, `batch` (free-text, không phải Batch Management thật — chỉ lưu mô tả), `note`.
- Không thêm cột `branch_id` riêng — chi nhánh suy ra từ `warehouse.branch` như các module khác.

**2. Backend Spring Boot**
- `GoodsIssueController`/`Service`/`Repository`/`Entity`/`Dto` — pattern y hệt `GoodsReceipt` (CRUD khi DRAFT, không cho sửa/xóa khi CLOSED).
- Xác nhận phiếu (`POST /api/goods-issues/{id}/confirm`): gọi `StockService.decrease()` cho từng dòng (y hệt cách `SalesOrderService` đang làm), `referenceType = "GOODS_ISSUE"`. Không viết logic trừ kho mới — tái dùng `StockService` có sẵn.
- `SecurityConfig`: GET authenticated, POST/PUT/DELETE `ADMIN`+`WAREHOUSE_MANAGER` — khớp pattern `goods-receipts`/`stock-takes`.

**3. Frontend React**
- Nối trang mock `pages/inventory/GoodsIssue/index.jsx` (`/inventory/goods-issue`, route giữ nguyên) sang API thật — bỏ `INITIAL_ISSUES`/`WAREHOUSE_OPTIONS`/`PRODUCT_OPTIONS` cứng, load qua `axiosClient` giống `GoodsReceipt`/`SalesOrder`.

### Module con 2: Inventory Transfer (Điều chuyển kho) — Migration V18

**Điểm đã chốt lại (thay đổi so với bản đầu):** KHÔNG gộp 1 bước nữa — tách thành **2 bước xác nhận thật, 2 màn hình riêng**, đúng như DMS thật (ảnh `dieu-chuyen-kho-inventorytransfer-tao-moi.png` + sidebar thật có 2 mục "Inventory Transfer for Branch" và "Inventory Transfer Confirmation" tách biệt) — để tránh hàng "bốc hơi" giữa đường, kho nguồn và kho đích xác nhận độc lập.

**Luồng trạng thái:** `DRAFT` → (kho nguồn xác nhận xuất) → `IN_TRANSIT` → (kho đích xác nhận nhận) → `CLOSED`

**1. Database Migration (V18)**
- Bảng `inventory_transfer`: `id`, `doc_number` (auto-gen tiền tố `DC`), `doc_date`, `posting_date`, `from_warehouse_id` (FK), `to_warehouse_id` (FK), `sales_employee_id` (FK User, nullable), `reason`, `remarks`, `status` (DRAFT/IN_TRANSIT/CLOSED), `sent_at`, `received_at`, `created_by`, `created_at`, `updated_at`.
- Bảng `inventory_transfer_item`: `id`, `inventory_transfer_id` (FK), `product_id` (FK), `quantity`, `batch`, `note`.

**2. Backend Spring Boot**
- `InventoryTransferController`/`Service`/`Repository`/`Entity`/`Dto` — pattern y hệt `GoodsReceipt`/`GoodsIssue`, CRUD khi DRAFT.
- `POST /api/inventory-transfers/{id}/confirm-send` (kho nguồn xác nhận xuất): chỉ cho phép khi status=DRAFT. Với từng dòng gọi `StockService.decrease(product, fromWarehouse, qty, "INVENTORY_TRANSFER", id)`. Status → `IN_TRANSIT`.
- `POST /api/inventory-transfers/{id}/confirm-receive` (kho đích xác nhận nhận): chỉ cho phép khi status=IN_TRANSIT. Với từng dòng gọi `StockService.increase(product, toWarehouse, qty, "INVENTORY_TRANSFER", id)`. Status → `CLOSED`.
- Mỗi bước là 1 request/1 transaction riêng (đúng bản chất 2 kho xác nhận ở 2 thời điểm khác nhau, không còn atomic-chung-1-transaction như bản cũ). Không cần thêm type `TRANSFER` mới trong `stock_transaction` — tái dùng `IN`/`OUT` có sẵn, chỉ thêm `referenceType = "INVENTORY_TRANSFER"` mới.
- `SecurityConfig`: pattern như trên.

**3. Frontend React — 2 trang riêng**
- **"Chuyển hàng tồn kho"** (`/inventory/transfer`, route giữ nguyên, đổi tên hiển thị trên Sidebar) — nối trang mock `pages/inventory/Transfer/index.jsx` sang API thật; nút "Xác nhận" ở đây gọi `confirm-send` (chỉ trừ kho nguồn, chưa cộng kho đích).
- **"Xác nhận di chuyển hàng tồn kho"** (`/inventory/transfer-confirmation`, trang MỚI) — danh sách các phiếu đang `IN_TRANSIT` (đã xuất, chờ kho đích xác nhận), nút "Xác nhận nhận hàng" gọi `confirm-receive` (cộng kho đích, đóng phiếu).
- Sidebar nhóm "Tồn kho" thêm 1 mục mới cho trang Xác nhận di chuyển.

### Trạng thái
- [x] Đã implement xong (Migration V17+V18 + Backend + Frontend), đã test qua API thật (login → tạo phiếu → xác nhận → kiểm tra `stock`/`stock_transaction` đúng số liệu, kể cả chặn xác nhận lại phiếu đã đóng 409), build frontend sạch. Chưa up git.
