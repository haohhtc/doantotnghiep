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
