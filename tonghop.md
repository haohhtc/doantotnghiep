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
- [x] Đã implement xong (Migration V17+V18 + Backend + Frontend), đã test qua API thật (login → tạo phiếu → xác nhận → kiểm tra `stock`/`stock_transaction` đúng số liệu, kể cả chặn xác nhận lại phiếu đã đóng 409), build frontend sạch. Đã up git.

## Module: Sales Order — tái cấu trúc Sidebar + Returns (V19) + Picking List/Delivery Note

Nguồn: file `NGHIEP-VU-DMS-THAM-CHIEU.html` (dòng 200-201, mục Sales Order 14 màn hình) đối chiếu với ảnh chụp menu thật (15 màn hình con: Sales Request, Sale Orders, Delivery Orders, Delivery Confirm, Invoices, Returns, Credit Memos, Document Generation, Printed Note (Express), Mass Process Delivery, Document Printing, Picking List/Delivery Note Printing, Delivery Results, Return Request, Upload VAT & PIT of Incentive).

### Quyết định theo từng mục
- **Sales Request → Sale Orders → Delivery Orders → Delivery Confirm**: ✅ đã xong từ trước (gộp thành 1 trang `/sales-orders`), không đụng tới.
- **Returns + Return Request**: 🔨 sẽ làm — Migration V19, gộp Return Request vào chung 1 bước với Returns.
- **Credit Memos**: rút gọn, không tách bảng riêng — chỉ cộng lại tồn kho khi duyệt Returns, **không trừ công nợ** (project chưa có khái niệm công nợ khách hàng, tránh trừ vào số chưa từng được cộng).
- **Picking List / Delivery Note Printing**: 🔨 sẽ làm — không cần bảng/API mới (tái dùng dữ liệu `sales_order` đã CONFIRMED), chỉ cần 1 trang hiển thị dạng phiếu kho + nút In dùng `window.print()` (CSS `@media print` ẩn Sidebar/Header/nút bấm khi in, chỉ còn nội dung phiếu).
- **Invoices, Mass Process Delivery, Delivery Results**: 🔨 sẽ làm — cả 3 đều thuần túy cộng thêm, không sửa `SalesOrderService`/`StockService` đang chạy ổn định.
- **Printed Note (Express), Document Printing, Document Generation**: 🚫 bỏ — chỉ xuất hiện trong ảnh thật, không có trong file tham khảo, cần hạ tầng sinh chứng từ mới phức tạp hơn Picking List/Delivery Note.
- **Upload VAT & PIT of Incentive**: 🚫 bỏ hẳn — thuế TNCN cho hoa hồng bán hàng, cần cả hệ thống lương/Incentive riêng, ngoài phạm vi hoàn toàn.
- **Van Sales Daily Payment**: 🚫 bỏ — đối soát tiền mặt cuối ngày cho nhân viên Van Sales, cần cả hệ thống thanh toán/kế toán riêng, ngoài phạm vi hoàn toàn (cùng lý do với Upload VAT & PIT of Incentive).

### 1. Frontend Sidebar
- Chuyển mục "Bán hàng" (hiện đang là item top-level đơn) thành Submenu **"Sales Order"** chứa đủ 15 mục con giống ảnh OMS mẫu.
- Route thật: "Sale Orders" → `/sales-orders` (data thật hiện có, không đổi) · "Returns" → `/sales/returns` (V19) · "Invoices" → `/sales/invoices` (V20) · "Picking List / Delivery Note" → `/sales/picking-list` (mở từ 1 đơn CONFIRMED cụ thể) · "Delivery Results" → `/sales/delivery-results` (trang báo cáo mới).
- "Credit Memos": **vẫn hiện trên Sidebar** (giữ đủ hình thức 15 mục), trỏ `PlaceholderPage` kèm ghi chú "chức năng đã gộp vào Returns" — tránh gây hiểu lầm là thiếu sót.
- Các mục còn lại bỏ hẳn (Sales Request, Delivery Orders, Delivery Confirm, Document Generation, Printed Note (Express), Document Printing, Van Sales Daily Payment, Upload VAT & PIT of Incentive) dựng `PlaceholderPage` (component có sẵn) để đúng cấu trúc giao diện OMS tham chiếu, chưa có logic thật.

### 2. Backend Migration & Service V19 (Returns)
- Migration V19: bảng `sales_return` (`id`, `doc_number`, `doc_date`, `customer_id`, `warehouse_id`, `sales_order_id` nullable — truy vết đơn gốc, `reason`, `remarks`, `status` DRAFT/CLOSED — đổi từ APPROVED sang CLOSED cho khớp đa số GoodsReceipt/GoodsIssue/InventoryTransfer, `created_by`, timestamps) và `sales_return_item` (`id`, `sales_return_id`, `product_id`, `quantity`, `note`).
- API CRUD cho Sales Return theo đúng pattern GoodsIssue/InventoryTransfer. Khi bấm **Duyệt** (DRAFT → CLOSED): gọi `StockService.increase()` cho từng dòng, `referenceType = "SALES_RETURN"`.
- `SecurityConfig`: áp **cùng quyền với Sales Order** (không có rule riêng hạn chế, rơi vào `anyRequest().authenticated()` — mọi role kể cả SALES_STAFF đều thao tác được), không dùng pattern ADMIN+WAREHOUSE_MANAGER như module kho thuần túy.

### 3. Frontend Returns Screen
- Trang danh sách + form tạo mới Phiếu trả hàng tại `/sales/returns`, chạy 100% data thật, theo đúng pattern GoodsIssue/InventoryTransfer đã có.

### 4. Picking List / Delivery Note Printing
- Trang mới tại `/sales/picking-list` hiển thị lại 1 đơn hàng đã CONFIRMED theo layout phiếu kho (mã đơn, khách hàng, kho, danh sách sản phẩm+số lượng) — không có bảng/API mới, chỉ đọc dữ liệu `sales_order` có sẵn.
- Nút "In" gọi `window.print()`, CSS `@media print` ẩn Sidebar/Header/nút bấm.

### 5. Invoices & thuế VAT (Migration V20)
- Bảng `invoice` (`id`, `invoice_number` auto-gen tiền tố `HD`, `invoice_date`, `sales_order_id` FK **UNIQUE** — chặn xuất hóa đơn trùng cho 1 đơn, `subtotal_amount`, `tax_amount`, `total_amount`, `created_by`, `created_at`) + `invoice_item` (`id`, `invoice_id`, `product_id`, `quantity`, `unit_price`, `tax_rate` — snapshot tại thời điểm xuất hóa đơn, `line_tax_amount`, `line_total`).
- Chỉ tạo được từ 1 `sales_order` đã CONFIRMED. Tính thuế: lấy `product.taxGroup.ratePercent` tại thời điểm bấm "Xuất hóa đơn" (coi null = 0%, làm tròn 2 chữ số `RoundingMode.HALF_UP`, chốt cứng vào `invoice_item` — không tính lại về sau).
- **Phạm vi giữ nguyên như đã chốt: KHÔNG sửa gì ở `SalesOrderService`/bảng `sales_order`/`sales_order_detail`** — không thêm cột thuế vào đó. Trang Sales Order chỉ hiển thị **ước tính thuế phía Frontend** (tính tạm từ dữ liệu Nhóm thuế đã tải sẵn, không lưu gì xuống DB) để người dùng xem trước khi xuất hóa đơn thật — số liệu thuế chính thức chỉ chốt và lưu trong `invoice_item`.
- Frontend: trang `/sales/invoices`, nút "Xuất hóa đơn" trên trang Sales Order (chỉ hiện khi đơn đã CONFIRMED và chưa có hóa đơn).

### 6. Mass Process Delivery
- Không cần API/bảng mới — thêm `rowSelection` (multi-select) + nút "Xác nhận hàng loạt" vào trang `/sales-orders` hiện có, gọi lặp lại đúng API `POST /api/sales-orders/{id}/confirm` đã test cho từng đơn được chọn, báo lỗi riêng cho đơn nào thất bại (VD thiếu tồn kho) mà không chặn các đơn còn lại.

### 7. Delivery Results
- Trang mới tại `/sales/delivery-results` — không cần API/bảng mới, lọc lại danh sách đơn `status = CONFIRMED` từ API `/sales-orders` sẵn có, hiển thị thêm ngày xác nhận.

### Trạng thái
- [x] Đã implement xong (Migration V22 Returns + V23 Invoices + Backend + Frontend, Sidebar 15 mục), đã test qua API thật (Sales Return cộng đúng tồn kho, Invoice tính thuế chính xác 10%, chặn xuất hóa đơn trùng 409, Mass Process Delivery báo lỗi riêng từng đơn). Build sạch. Lưu ý: migration đánh số thực tế là **V22 (Returns)** và **V23 (Invoices)**, không phải V19/V20 như ghi ban đầu — V19-V21 đã dùng cho module "Nhi đặt hàng lớn" làm trước.

## Module: Purchase Order — Goods Return (V21)

Nguồn: file `NGHIEP-VU-DMS-THAM-CHIEU.html` (dòng 203-204, mục Purchase Order 9 màn hình: Purchase Request, Goods Receipt PO + Confirmation, Goods Return Request → Confirm → Goods Return, Auto RPO log · SKU Target Setup).

### Quyết định theo từng mục
- **Purchase Request**: ✅ đã xong từ trước (gộp vào hành động tạo Phiếu nhập kho).
- **Goods Receipt PO + Confirmation**: ✅ đã xong từ trước (gộp vào luồng DRAFT→CLOSED của Goods Receipt, `/goods-receipts`).
- **Goods Return Request → Confirm → Goods Return**: 🔨 sẽ làm — Migration V21, dùng lại `StockService.decrease()` giống hệt pattern Goods Issue, an toàn/ít rủi ro vì tái dùng logic đã test.
- **Auto RPO log · SKU Target Setup**: 🚫 bỏ — cần hạ tầng tự động hóa/lập lịch (Spring Scheduling) hoàn toàn mới, không tận dụng được gì từ code cũ, khó test/demo, không bắt buộc theo file DMS. "SKU Target Setup" về bản chất trùng với `stock_alert.min_quantity` đã có sẵn.

### 1. Frontend Sidebar
- Submenu **"Purchase Order"** mới, đặt ngay sau "Tồn kho" (ngang hàng, không lồng bên trong), gồm:
  - "Purchase Request" → `PlaceholderPage` (ghi chú: đã gộp vào Goods Receipt PO).
  - "Goods Receipt PO" → trỏ thẳng route `/goods-receipts` có sẵn (tái dùng, không tạo route/trang trùng dữ liệu — giống cách "Nhân viên" trỏ về `/users`).
  - "Trả hàng NCC" (Goods Return) → route mới `/purchase/goods-return` (V21, data thật).
  - "Auto RPO log · SKU Target Setup" → `PlaceholderPage`.

### 2. Backend Migration & Service V21 (Goods Return)
- Migration V21: bảng `purchase_return` (`id`, `doc_number`, `doc_date`, `posting_date`, `supplier_id`, `warehouse_id`, `goods_receipt_id` nullable — truy vết phiếu nhập gốc, `reason`, `remarks`, `status` DRAFT/CLOSED, `created_by`, timestamps) và `purchase_return_item` (`id`, `purchase_return_id`, `product_id`, `quantity`, `note`).
- API CRUD cho Purchase Return theo đúng pattern Goods Issue. Khi bấm **Duyệt** (DRAFT → CLOSED): gọi `StockService.decrease()` cho từng dòng, `referenceType = "PURCHASE_RETURN"`.
- `SecurityConfig`: áp **quyền kho** — chỉ ADMIN + WAREHOUSE_MANAGER được thêm/sửa/xóa/duyệt, khớp pattern Goods Issue/Inventory Transfer (khác với Sales Return dùng quyền mở theo Sales Order).

### 3. Frontend Goods Return Screen
- Trang danh sách + form tạo mới Phiếu trả hàng NCC tại `/purchase/goods-return`, chạy 100% data thật, theo đúng UI pattern Goods Issue đã có.

### Trạng thái
- [x] Đã implement xong (Migration thực tế là **V24**, không phải V21), đã test qua API thật (tạo/duyệt phiếu trả hàng NCC trừ đúng tồn kho, dùng đúng quyền ADMIN+WAREHOUSE_MANAGER khác với Sales Return). Build sạch.

## Module: Quản trị — 6 mục còn thiếu (V22-V27)

Nguồn: file `NGHIEP-VU-DMS-THAM-CHIEU.html` (dòng 206-207, mục Quản trị 19 màn hình: Users·Roles·Organization units, Security logs·Login Device Management, Numbering Configs, Approval Process·Settings·Email Config).

Users/Roles/Organization units đã xong từ trước. Cả 6 mục dưới đây đặt chung trong Submenu **"Hệ thống"** có sẵn (chỉ ADMIN thấy được, đúng theo `ProtectedRoute allowedRoles={['ADMIN']}` hiện tại của `/users`/`/roles`), thêm mục con mới bên cạnh "Người dùng"/"Phân quyền".

**Đã xác nhận rủi ro trước khi làm** (xem phân tích ở trên) — 2 mục Login Device Management và Approval Process đụng vào hạ tầng dùng chung (JwtAuthFilter, trạng thái mọi chứng từ), cần test lại toàn bộ các module cũ sau khi xong.

### 1. Security Logs — Migration V22
- Bảng `login_log`: `id`, `username`, `success` (boolean), `ip_address`, `user_agent` (nullable), `created_at`.
- Ghi log ngay trong `AuthController.login()`, bọc riêng `try-catch` — lỗi ghi log **không được** làm chặn đăng nhập thật. Không lưu mật khẩu vào log dù đăng nhập đúng hay sai.
- API: `GET /api/login-logs` (chỉ ADMIN).
- Frontend: trang mới `/system/login-logs`.

### 2. Numbering Configs — Migration V23
- Bảng `numbering_config`: `id`, `doc_type` (GOODS_RECEIPT/GOODS_ISSUE/INVENTORY_TRANSFER/SALES_ORDER/SALES_RETURN/PURCHASE_RETURN...), `prefix`, `current_sequence`, `updated_at`.
- Thêm `NumberingConfigService` trung tâm (giống vai trò `StockService` — nơi duy nhất được sinh số phiếu), sửa lại `resolveDocNumber()` ở từng Service hiện có (GoodsReceipt, GoodsIssue, InventoryTransfer, SalesOrder...) để gọi qua đây thay vì hardcode tiền tố + đếm riêng lẻ.
- Rủi ro chính: phải test lại (hồi quy) toàn bộ luồng tạo phiếu ở mọi module đã làm, tránh sinh trùng `doc_number` (đang có ràng buộc UNIQUE).
- API CRUD cho ADMIN sửa `prefix` (không cho sửa `current_sequence` trực tiếp, tránh nhảy số/trùng số).
- Frontend: `/system/numbering-configs`.

### 3. Login Device Management — Migration V24
- Bảng `active_session`: `id`, `user_id`, `token_hash` (không lưu token gốc), `device_info`, `ip_address`, `login_at`, `revoked` (boolean), `revoked_at`.
- `AuthController.login()` ghi 1 dòng `active_session` mới mỗi lần đăng nhập thành công.
- **Sửa `JwtAuthFilter`** (chạy cho mọi request có xác thực): sau khi verify JWT hợp lệ, kiểm tra thêm token có `revoked = true` trong `active_session` không — đây là điểm rủi ro cao nhất, cần test kỹ mọi API khác sau khi sửa để đảm bảo không chặn nhầm người dùng hợp lệ.
- API: `GET /api/system/sessions` (ADMIN xem ai đang đăng nhập ở đâu), `POST /api/system/sessions/{id}/revoke` (đăng xuất từ xa 1 thiết bị).
- Frontend: `/system/login-devices`.

### 4. Approval Process — Migration V25 (đơn giản hóa để giảm rủi ro)
- **Không redesign lại trạng thái của các module đã có** (giữ nguyên DRAFT/CLOSED, PENDING/CONFIRMED/CANCELLED... như hiện tại — tránh rủi ro phá vỡ hành vi đã test kỹ).
- Chỉ làm ở mức **cấu hình mô tả**: bảng `approval_config` (`doc_type`, `require_approval` boolean, `approver_role`) — lưu thông tin "loại chứng từ nào cần role gì duyệt" nhưng **chưa thực sự chặn/thay đổi logic Service hiện tại** (giống cách `TaxGroup`/`CustomerGroup` lưu dữ liệu mô tả trước khi thực sự áp dụng).
- API CRUD cho ADMIN xem/cấu hình. Frontend: `/system/approval-process`.
- Ghi chú rõ trong UI: đây là màn hình cấu hình tham khảo, có thể mở rộng để thực sự áp dụng ở phiên bản sau.

### 5. Settings — Migration V26
- Bảng `system_setting`: `id`, `setting_key` (UNIQUE), `setting_value`, `description`, `updated_at`.
- API CRUD đơn giản. Frontend: `/system/settings`.
- Ghi chú: đây là dữ liệu cấu hình chung, tương tự Nhóm khách hàng/Chức vụ trước đây — có thể chưa có nơi nào đọc/áp dụng giá trị cụ thể, chỉ phục vụ mục đích lưu trữ/hiển thị.

### 6. Email Config — Migration V27
- Thêm dependency `spring-boot-starter-mail` vào `pom.xml`.
- Bảng `email_config`: `id`, `smtp_host`, `smtp_port`, `smtp_username`, `smtp_password`, `updated_at`.
- **Không gửi email thật** (tránh rủi ro fail lúc demo do mạng chặn SMTP, và tránh rò rỉ thông tin đăng nhập email) — giả lập bằng cách khi "gửi", chỉ ghi vào bảng `email_log` (`to`, `subject`, `body`, `sent_at`) thay vì gọi SMTP thật, giống cách nút "Xuất file" đã làm giả lập trước đây.
- Frontend: `/system/email-config`.

### Frontend Sidebar
- Submenu "Hệ thống" (có sẵn) thêm 6 mục con mới bên cạnh "Người dùng"/"Phân quyền": Nhật ký đăng nhập, Cấu hình đánh số chứng từ, Quản lý thiết bị đăng nhập, Quy trình duyệt, Cài đặt hệ thống, Cấu hình Email — tất cả chỉ ADMIN thấy được (đúng quyền hiện tại của nhóm này).

### Trạng thái
- [x] Đã implement xong cả 6 mục (Migration thực tế **V25-V31**, không phải V22-V27 — thêm V31 phát sinh giữa chừng để sửa 1 lỗi tìm được lúc test, xem bên dưới). Đã test kỹ theo đúng cảnh báo rủi ro đã ghi (Login Device Management + Numbering Configs): rà soát hồi quy toàn bộ API cũ sau khi sửa `JwtAuthFilter`, không phát sinh lỗi. Build sạch.
- **Lỗi thật tìm được và đã sửa lúc test** (đúng tinh thần "test thật trước khi báo xong"):
  1. `AuthService.login()` đang `@Transactional(readOnly = true)` — sau khi thêm ghi `login_log`/`active_session` vào đây thì bị lỗi 500 "Transaction silently rolled back" vì MySQL chặn ghi trên JDBC connection readOnly. Đã bỏ `readOnly = true`.
  2. `active_session.token_hash` ban đầu đặt `UNIQUE` — JWT chỉ chính xác tới giây nên 2 lần đăng nhập trong cùng 1 giây sinh token giống hệt nhau, vi phạm UNIQUE, lỗi lan sang cả transaction đăng nhập chính dù đã bọc try-catch (đặc thù Hibernate: exception khi flush INSERT làm hỏng transaction bao ngoài kể cả khi Java catch được). Đã thêm Migration **V31** bỏ UNIQUE này + tách việc ghi log/session sang `Propagation.REQUIRES_NEW` (transaction riêng) để lỗi ghi log không bao giờ ảnh hưởng luồng đăng nhập thật.

## Module: Nhi đặt hàng lớn — Header/Branch Context, Kho theo Branch, Product 3-tab, Price List mua/bán, Employee tách bảng, Route 2 timeline, Report rỗng

Nguồn: yêu cầu trực tiếp (không từ file DMS) + ảnh tham khảo OMS thật (`hinhanh/`). Đây là đợt yêu cầu lớn nhất từ trước tới giờ, đụng vào gần hết các module đã xây — làm theo thứ tự vì nhiều nhóm phụ thuộc nhau (Nhóm 1 → 2/6 → 5 → Branch field ở Nhóm 1 phụ thuộc Nhóm 5).

### Nhóm 1: Header & Layout
- **Fix bug mất nút Thêm/Sửa/Xóa lúc load đầu**: điều tra nguyên nhân trước khi sửa (nghi do các trang khai báo `const canWrite = hasAnyRole(...)` ở ngoài component — tính 1 lần lúc file được import, không phản ứng lại nếu lúc đó `localStorage` chưa kịp có user) — đây có thể là lỗi ở **nhiều trang cùng lúc**, cần rà soát diện rộng chứ không sửa 1 chỗ.
- **Header hàng 1**: nút thu gọn Sidebar + **Branch Selector** (badge dạng `{mã CN} - {tên người phụ trách/quản lý}`, bấm mở popup bảng chọn chi nhánh có tìm kiếm theo Branch Code/Branch Name/Company — đúng mẫu ảnh OMS thật) bên trái; Avatar + Đăng xuất bên phải. **Không có Breadcrumb** ở hàng này.
- **Header hàng 2 (mới)**: Breadcrumb xuống hàng riêng, ngay dưới hàng 1.
- **Branch Context toàn cục**: lưu chi nhánh đang chọn (React Context/localStorage) — làm nền cho Nhóm 2 (Kho/Tồn kho) và Nhóm 6 (Sales Order).
- Sidebar: dời mục "Kho" ra khỏi "Company Setup", đưa vào nhóm **"Tồn kho"**.
- Nhà cung cấp: đổi nhãn "Kích hoạt" → "Hoạt động".

### Nhóm 2: Warehouse & Inventory theo Branch
- `BranchService.create()`: tự động sinh 3 `Warehouse` (MAIN/VAN/DAMAGE) mỗi khi tạo Chi nhánh mới, đặt tên theo mẫu DMS thật (`{mã CN}MWH01`/`VWH01`/`DWH01`).
- Trang **"Kho"** (`/warehouses`, MDM): hiển thị/lọc danh sách kho theo từng Chi nhánh.
- Trang **"Tồn kho"** (đổi tên từ "Báo cáo tồn kho", route `/inventory`): lọc theo Branch Selector ở Header — chỉ hiện SP thuộc chi nhánh đó (dựa vào Item-Branch Assignment đã có), mỗi SP luôn đủ 3 dòng (3 loại kho, kể cả tồn = 0). Cột "Kho" đổi hiển thị thành **"Loại kho"** (warehouseType) thay vì tên kho.

### Nhóm 3: Product & Master Data
- **Migration**: `product` bỏ cột `price` và cột đơn vị tính cũ (`unit` text tự do); thêm 6 cột FK mới thay cho bộ `uom_id/tax_group_id` cũ: `purchase_uom_id`, `purchase_tax_group_id`, `sale_uom_id`, `sale_tax_group_id`, `inventory_uom_id`, `inventory_tax_group_id`. Giữ nguyên `uom_group_id` dùng chung cho cả 3 tab (chỉ 1 nhóm quy đổi/sản phẩm).
- Frontend Sản phẩm: bỏ Form.Item "Đơn vị tính (cũ)" và "Giá". Thêm 3 Tab **Purchase / Sale / Inventory**, mỗi tab có Select Đơn vị tính (base, lọc theo `uom_group_id` đã chọn) + Select Nhóm thuế riêng. Tab Inventory's Base UOM chính là đơn vị mà `stock.quantity` được tính theo.
- "Nhóm sản phẩm" (ProductCategory) hiện có → đổi nhãn hiển thị thành **"Thuộc tính"**; Form Sản phẩm đổi nhãn field "Danh mục" → "Thuộc tính" (không đổi field/API, chỉ đổi nhãn).
- **Tạo mới** màn hình **"Nhóm sản phẩm"** thật (M:N) — Migration mới: bảng `product_group` (`id`, `code`, `name`, `description`) + `product_group_item` (`id`, `product_group_id`, `product_id`) — UI dạng Master-Detail đơn giản: chọn 1 nhóm, danh sách Mã SP + Tên SP, nút thêm/gỡ (không có cột tỷ lệ quy đổi/mặc định).

### Nhóm 4: Price List
- Đổi `price_list.type` từ STANDARD/CHANNEL/CONTRACT sang **hard-code 2 giá trị**: `PURCHASE` (Bảng giá mua) / `SALE` (Bảng giá bán).
- `PriceListService.lookupPrice()`: thêm tham số "mục đích" (PURCHASE/SALE) để chỉ xét đúng loại bảng giá tương ứng. **Bỏ hẳn tầng fallback về `product.price`** (vì field này đã bị xóa ở Nhóm 3) — khi không tìm được giá hợp lệ (hết hạn hoặc không có dòng giá), **ném lỗi rõ ràng** thay vì fallback.
- Tích hợp vào **cả 2 luồng**: Sales Order (đã có, chỉnh sang dùng loại SALE) và **Goods Receipt** (mới — hiện đang nhập tay `unitPrice`, cần sửa thêm để tự động tra giá loại PURCHASE, bắt buộc báo lỗi nếu không có giá, chặn tạo/xác nhận phiếu).
- Đồng bộ SP trong `price_list_item` theo Item-Branch Assignment: **không cho xóa** dòng giá của SP đang được phân bổ ở branch nào đó (chỉ cho sửa giá). Lưu ý: đơn hàng cũ không bị ảnh hưởng khi xóa giá vì `unitPrice` đã được chốt cứng vào từng dòng chi tiết đơn từ lúc tạo — rule này bảo vệ tính nhất quán cho **các đơn/phiếu mới sau này**, không phải để tránh sai lệch dữ liệu lịch sử.

### Nhóm 5: Employee & Route (MCP)
- **Tách Employee thành bảng riêng khỏi `User`** — Migration mới: bảng `employee` (`id`, `type` [NVBH/NV], `code`, `full_name`, `phone`, `email`, `gender`, `birth_date`, `address`, `id_card_number`, `tax_code`, `position_id` FK → `employee_position` có sẵn, `hire_date`, `resign_date`, `is_delivery_man` boolean, `active`, `user_id` nullable FK → `User` — tương ứng "Tự động gán user"). 1 bảng chung cho cả 2 tab, lọc theo `type`; tab NVBH chỉ cho chọn `position` = SALESMAN, tab NV chỉ cho chọn SS/ASM.
- Nhóm khách hàng: chuyển từ FK đơn giản (`customer.group_id`) sang **M:N** — bảng `customer_group_member` (`customer_group_id`, `customer_id`), UI Master-Detail giống Nhóm sản phẩm mới.
- **Route — tách 2 bảng độc lập** (Cách B đã chọn): `route_salesman_assignment` và `route_manager_assignment`, mỗi bảng: `route_master_id`, `employee_id`, `effective_date`, `end_date` (nullable). Validate:
  - Không chồng khoảng thời gian giữa 2 nhân sự trong cùng 1 bảng cho cùng 1 route (cho phép có khoảng trống giữa 2 người, chỉ cấm chồng lấn).
  - Quy tắc `end_date` chỉ áp cho **dòng đang hoạt động (mới nhất, chưa bị đóng)**, không áp cho các dòng lịch sử đã đóng: nếu `RouteMaster.end_date IS NULL` → dòng phân bổ hiện tại được để trống `end_date`; nếu `RouteMaster.end_date` có giá trị → dòng phân bổ hiện tại bắt buộc phải có `end_date` và không được vượt quá `RouteMaster.end_date`. Các dòng lịch sử (đã đóng do đổi người) luôn có `end_date` riêng của nó, không bị ràng buộc phải khớp NULL/not-NULL với Route.
  - Khi đóng dòng phân bổ của người cũ (do đổi người mới): `end_date` được chọn phải `>= CURRENT_DATE` (không cho lùi về quá khứ).
- `RouteMasterOutlet`: thêm cột `visit_order` (thứ tự ghé thăm) + các cột lịch ghé thăm (`monday`...`sunday` boolean, `week1`...`week4` boolean, theo đúng ảnh tham khảo). Validate: 1 khách hàng chỉ được thuộc 1 tuyến — chặn thêm nếu KH đã có ở `route_master_outlet` của tuyến khác (kiểm tra tồn tại, không theo ngày).
- `Branch`: thêm `default_manager_id`, `default_salesman_id` (FK → `employee`, lọc theo `type` tương ứng) — chỉ là giá trị gợi ý mặc định khi tạo Route mới, không bắt buộc.

### Nhóm 6: Sales Order — Branch & Loại ghé thăm
- Validate: Khách hàng chọn trong SO phải thuộc đúng Chi nhánh đang chọn ở Branch Selector (Header).
- Thêm field **"Loại ghé thăm"** tự động tính khi chọn khách hàng + ngày: tính Thứ + Tuần (`Math.ceil(ngày trong tháng / 7)`) của hôm nay, đối chiếu với lịch cấu hình ở `route_master_outlet` (cột thứ/tuần) của khách đó → khớp thì "Đúng tuyến", không khớp thì "Trái tuyến".

### Nhóm 7: Module Reports (rỗng cho Nhi)
- Sidebar mới "Báo cáo": 4 trang con — BC bán hàng, BC kho, BC mua hàng, BC danh mục.
- Mỗi trang chỉ có tiêu đề + 1 vùng nội dung trống (kiểu khung dashboard, để trống hẳn phần bên phải/nội dung chính) — không có API/dữ liệu gì, chỉ tạo khung UI cho Nhi gắn PowerBI vào sau.

### Trạng thái
- [x] Đã implement xong toàn bộ 7 Nhóm (Migration V19-V21 + Backend + Frontend), đã test qua Flyway migrate thật (V19→V20→V21 chạy sạch trên DB dev, Hibernate `ddl-auto: validate` pass) + test qua API thật sau khi code xong (phát hiện và sửa 1 lỗi LazyInitializationException ở `route-info`), build backend + frontend sạch. Chi tiết đầy đủ + hướng dẫn test xem file `dalam.md`. Đã commit local (3 commit), **chưa push lên remote** (đang chờ xác nhận).
- Quyết định phát sinh trong lúc làm (đã hỏi xác nhận người dùng): 2 bảng `route_salesman_assignment`/`route_manager_assignment` mới **thay thế hẳn** module "Giao tuyến vận hành" (RouteSetting) cũ — không giữ song song.
