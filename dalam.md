# Tổng hợp những gì đã làm

Đối chiếu theo file `NGHIEP-VU-DMS-THAM-CHIEU.html` (5 nhóm module trong phạm vi đồ án: MDM, Inventory, Sales Order, Purchase Order, Quản trị).

## MDM (Danh mục)

| Nhóm (theo DMS) | Đã làm | Ghi chú |
|---|---|---|
| Geographical | ✅ | Region → Province → District → Ward, cascading dropdown, gắn vào SellingZone/Branch/Customer |
| Sales Organization | ✅ | Vùng bán hàng (Selling Zone). Sales Territory không tách bảng riêng — dùng chung Geography |
| Company Setup | ✅ | Công ty (singleton) → Chi nhánh → Kho, Nhà cung cấp |
| Product | ✅ | Sản phẩm tách **3 tab Purchase/Sale/Inventory** (mỗi tab 1 ĐVT + 1 Nhóm thuế riêng, dùng chung 1 Nhóm quy đổi) — đã bỏ cột `price` và ĐVT cũ (text tự do). "Nhóm sản phẩm" (ProductCategory) cũ đổi nhãn hiển thị thành **"Thuộc tính"**; có thêm module **"Nhóm sản phẩm"** thật (M:N) mới. Item-Branch Assignment (2 chiều) giữ nguyên |
| Price list | ✅ | Đổi hẳn sang hard-code 2 loại: **Mua (PURCHASE)** / **Bán (SALE)**, tra giá tự động theo đúng loại (Sales Order dùng SALE, **Goods Receipt dùng PURCHASE** — mới nối), **không còn fallback** về `product.price` (đã xóa cột) — thiếu giá sẽ báo lỗi rõ ràng chặn luôn |
| Customers | ✅ | Hồ sơ khách hàng, Nhóm khách hàng (đã chuyển sang **M:N**, quản lý tại trang Nhóm khách hàng), Kênh bán hàng |
| Employees | ✅ | **Tách hẳn bảng `employee` riêng khỏi `user`** (2 tab NVBH/NV, đủ field hồ sơ nhân sự + cờ "kiêm giao hàng" + tùy chọn gán tài khoản đăng nhập) |
| Route & MCP | ✅ | Khung tuyến (Route Master) + **2 timeline nhân sự độc lập** (NVBH/Quản lý qua `route_salesman_assignment`/`route_manager_assignment`, **thay thế hẳn** module "Giao tuyến vận hành" cũ) + outlet có thêm thứ tự ghé thăm + lịch ghé thăm theo thứ/tuần |

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

## Đợt yêu cầu lớn "Nhi đặt hàng" (Header/Branch/Kho/Product/PriceList/Employee/Route/Reports) — MỚI

Toàn bộ 7 nhóm trong file `tonghop.md` mục "Nhi đặt hàng lớn" — Migration V19, V20, V21. Đã chạy Flyway thật trên DB dev (không phải đoán), build backend + frontend sạch.

### Nhóm 1: Header & Layout
- Fix bug **mất nút Thêm/Sửa/Xóa lúc load đầu** (nghiêm trọng, ảnh hưởng 26 trang): nguyên nhân xác định qua code trace — `AppRoutes.jsx` import tĩnh mọi trang ngay từ đầu, mỗi trang khai báo `const canWrite = hasAnyRole(...)` ở **ngoài component** (module scope) nên chỉ tính 1 lần lúc bundle load (thường là trước khi đăng nhập), không tự tính lại sau khi đăng nhập xong (chỉ F5 mới đúng). Đã sửa cả 26 file: dời `canWrite` vào **trong** component, tính lại mỗi lần render.
- Header tách 2 hàng: hàng 1 = nút thu gọn Sidebar + **Branch Selector** (badge `{mã CN} - {tên CN}`, bấm mở popup tìm theo mã/tên/công ty) + Avatar/Đăng xuất; hàng 2 = Breadcrumb riêng.
- **Branch Context** toàn cục (`contexts/BranchContext.jsx`) — lưu chi nhánh đang chọn, làm nền cho Nhóm 2/6. Đặt `BranchProvider` bên trong `AppLayout` (không phải App.jsx) để tránh lặp lại đúng bug canWrite (nếu đặt bao cả trang Login, lần gọi `GET /branches` đầu sẽ 401 vì chưa có token và không tự thử lại).
- Sidebar: "Kho" dời từ "Company Setup" sang "Tồn kho".
- Nhà cung cấp: đổi nhãn "Kích hoạt" → "Hoạt động".

### Nhóm 2: Kho & Tồn kho theo Chi nhánh
- Tạo Chi nhánh mới → tự động sinh 3 Kho (MAIN/VAN/DAMAGE, mã `{mã CN}MWH01`/`VWH01`/`DWH01`).
- Trang "Tồn kho" (đổi tên từ "Báo cáo tồn kho") lọc theo Branch Selector ở Header — chỉ hiện SP thuộc chi nhánh đó × 3 kho của chi nhánh, luôn đủ 3 dòng/SP kể cả tồn = 0. Cột "Kho" đổi thành "Loại kho".

### Nhóm 3: Product 3-tab + Nhóm sản phẩm (M:N)
- Product: bỏ `price`/ĐVT cũ, tách `purchase_uom/tax_group`, `sale_uom/tax_group`, `inventory_uom/tax_group` (dùng chung 1 `uom_group`).
- "Nhóm sản phẩm" (ProductCategory) cũ → đổi nhãn "Thuộc tính". Module **"Nhóm sản phẩm"** mới (M:N thật) tại `/product-groups`.

### Nhóm 4: Bảng giá Mua/Bán
- `price_list.type` hard-code PURCHASE/SALE. Goods Receipt giờ tự tra giá mua (giống Sales Order tra giá bán) — không tìm được giá sẽ báo lỗi, không cho lùi về `product.price` (đã xóa).
- Không cho xóa dòng giá của SP đang được phân bổ ở chi nhánh nào đó (chỉ sửa được).

### Nhóm 5: Employee tách bảng + Customer Group M:N + Route 2 timeline
- Bảng `employee` mới, độc lập với `user` (2 tab NVBH/NV tại `/employees`).
- Nhóm khách hàng chuyển M:N — quản lý tại trang Nhóm khách hàng (giống UI Nhóm sản phẩm).
- **Quyết định đã hỏi và được xác nhận**: 2 bảng mới `route_salesman_assignment`/`route_manager_assignment` **thay thế hẳn** module "Giao tuyến vận hành" (RouteSetting) cũ — không giữ song song. Dữ liệu cũ đã tự động migrate sang bảng mới trước khi xóa bảng cũ. Quản lý 2 timeline này ngay trong trang "Khung tuyến" (`/route-masters`, nút "Nhân sự").
- Validate: không chồng thời gian giữa 2 người cùng 1 timeline; dòng đang hoạt động bắt buộc khớp end_date với Route (nếu Route chưa kết thúc thì dòng hiện tại cũng không được có end_date, và ngược lại); khi đóng 1 dòng để đổi người, ngày kết thúc phải từ hôm nay trở đi.
- `route_master_outlet` thêm thứ tự ghé thăm + lịch ghé thăm theo thứ/tuần trong tháng; 1 khách hàng chỉ được thuộc 1 tuyến.
- Chi nhánh thêm Quản lý/NVBH mặc định (chỉ là gợi ý, không bắt buộc).

### Nhóm 6: Sales Order — Chi nhánh & Loại ghé thăm
- Chọn Khách hàng trong đơn hàng → tự tra chi nhánh + lịch ghé thăm của khách (suy ra từ tuyến đang gán) → cảnh báo nếu khác chi nhánh đang chọn ở Header (chặn Lưu), hiển thị tag "Đúng tuyến"/"Trái tuyến" theo ngày đặt hàng.

### Nhóm 7: Module Báo cáo (khung rỗng cho Nhi)
- Sidebar "Báo cáo": 4 trang trống (BC bán hàng/kho/mua hàng/danh mục) — chỉ tiêu đề + khung trống, không có API/dữ liệu, để Nhi gắn PowerBI vào sau.

## Chưa làm / ngoài phạm vi

- Sales Order: Returns, Invoices, Picking List/Delivery Note, Mass Process Delivery, Delivery Results — đã phân tích/lên kế hoạch chi tiết trong `tonghop.md`, **chưa code**.
- Purchase Order: Goods Return (trả hàng NCC) — đã lên kế hoạch trong `tonghop.md`, **chưa code**.
- Quản trị: Security Logs, Numbering Configs, Login Device Management, Approval Process, Settings, Email Config (6 mục) — đã lên kế hoạch trong `tonghop.md`, **chưa code**.
- POSM Inventory — thuộc Trade Marketing, chủ động bỏ.
- Batch Management, Promotions — chủ động bỏ theo bảng đối chiếu trong file DMS reference (không nằm trong phạm vi đồ án).

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

## Cách test đợt "Nhi đặt hàng lớn" (Nhóm 1-7)

**Trước khi test**: chạy lại backend 1 lần (`cd backend; .\mvnw.cmd spring-boot:run` với `OLTP_DB_PORT=3308` nếu chạy ngoài Docker) để Flyway tự áp V19→V20→V21 — đã tự kiểm tra migrate sạch, không cần thao tác tay gì thêm với DB.

**1. Bug mất nút Thêm/Sửa/Xóa (Nhóm 1)**: đăng nhập bằng tài khoản ADMIN/WAREHOUSE_MANAGER → vào bất kỳ trang danh mục nào (VD Chi nhánh, Sản phẩm) ngay sau khi đăng nhập (không F5) → nút "Thêm" và cột "Thao tác" phải hiện đầy đủ ngay từ lần render đầu tiên (trước đây phải F5 mới hiện).

**2. Branch Selector (Nhóm 1)**: nhìn góc trái Header — thấy badge xanh dạng "{mã CN} - {tên CN}". Bấm vào → popup mở ra, gõ tìm theo mã/tên chi nhánh/công ty → chọn 1 chi nhánh khác → badge đổi theo, đồng thời trang "Tồn kho" (nếu đang mở) sẽ tự lọc lại theo chi nhánh mới.

**3. Auto-tạo Kho + Tồn kho theo chi nhánh (Nhóm 2)**: vào Chi nhánh → Thêm chi nhánh mới, lưu → vào trang Kho (`/warehouses`), lọc theo chi nhánh vừa tạo → phải thấy đúng 3 kho (MAIN/VAN/DAMAGE) tự sinh. Vào trang "Tồn kho" (`/inventory/inventories`), chọn chi nhánh đó ở Branch Selector → nếu chưa gán sản phẩm nào cho chi nhánh (Item-Branch Assignment) thì bảng trống — vào trang Sản phẩm, dùng nút "Phân bổ theo chi nhánh" gán vài SP cho chi nhánh này → quay lại Tồn kho sẽ thấy mỗi SP đủ 3 dòng (3 loại kho), tồn = 0 nếu chưa nhập/xuất gì.

**4. Product 3-tab (Nhóm 3)**: vào Sản phẩm → Sửa 1 sản phẩm → thấy 3 tab Purchase/Sale/Inventory, mỗi tab chọn ĐVT + Nhóm thuế riêng (ĐVT lọc theo Nhóm quy đổi đã chọn phía trên) — không còn field "Giá" hay "Đơn vị tính (cũ)".

**5. Nhóm sản phẩm M:N (Nhóm 3)**: Sidebar > Danh mục > Sản phẩm > "Nhóm sản phẩm" (mục "Thuộc tính" là ProductCategory cũ, đã đổi tên) → Thêm 1 nhóm → bấm nút "Sản phẩm" trên dòng vừa tạo → thêm/gỡ sản phẩm vào nhóm.

**6. Bảng giá Mua/Bán (Nhóm 4)**: vào Bảng giá → Thêm mới, Loại chọn "Bảng giá mua" hoặc "Bảng giá bán" → thêm giá cho 1 sản phẩm. Vào Nhập hàng (Goods Receipt) → tạo phiếu mới → thêm dòng, chọn sản phẩm đã có giá mua → đơn giá tự điền theo bảng giá mua (không cần gõ tay). Nếu chọn sản phẩm chưa có giá mua nào → sẽ báo lỗi đỏ, phải tự nhập tay.

**7. Employee tách bảng (Nhóm 5)**: Sidebar > Danh mục > Nhân viên > "Nhân viên" → 2 tab NVBH/Quản lý, mỗi tab CRUD riêng với đủ field hồ sơ (SĐT, email, CMND, ngày sinh...). Tab NVBH có thêm checkbox "Kiêm giao hàng".

**8. Route 2 timeline (Nhóm 5) — quan trọng nhất, cần test kỹ**:
   - Vào Khung tuyến (`/route-masters`) → bấm "Nhân sự" trên 1 khung tuyến → thấy 2 tab "Nhân viên bán hàng"/"Quản lý", mỗi tab là 1 timeline độc lập.
   - Thêm 1 dòng phân bổ: chọn nhân viên + ngày hiệu lực → nếu khung tuyến **chưa có ngày kết thúc**, để trống "Ngày kết thúc" mới thêm được (điền vào sẽ báo lỗi); nếu khung tuyến **đã có ngày kết thúc**, bắt buộc phải điền ngày kết thúc (và không được vượt quá ngày kết thúc của khung tuyến).
   - Test đổi người: với dòng đang "Đang hoạt động", bấm "Đóng" → nhập ngày kết thúc (mặc định hôm nay) → chỉ chấp nhận ngày **từ hôm nay trở đi** (chọn ngày quá khứ sẽ báo lỗi) → sau khi đóng, thêm dòng mới cho người kế nhiệm với ngày hiệu lực sau ngày đóng — hệ thống chặn nếu 2 khoảng thời gian bị chồng lấn.
   - Vào tab "List Of Outlet" (nút "Khách hàng" trên khung tuyến) → thêm khách hàng vào tuyến kèm thứ tự ghé thăm + tick chọn thứ/tuần ghé thăm. Thử thêm cùng 1 khách hàng vào 1 khung tuyến khác → phải bị chặn ("1 khách hàng chỉ được thuộc 1 tuyến").

**9. Sales Order — Chi nhánh & Loại ghé thăm (Nhóm 6)**: mở đơn hàng mới, chọn 1 khách hàng đã được gán vào 1 tuyến (bước 8) → nếu chi nhánh của tuyến khách đó khác với Branch Selector đang chọn ở Header, sẽ hiện tag đỏ cảnh báo và bấm Lưu sẽ bị chặn — đổi Branch Selector về đúng chi nhánh của khách thì Lưu được. Đổi "Ngày đặt hàng" sang 1 ngày trùng lịch ghé thăm đã tick ở bước 8 → thấy tag xanh "Đúng tuyến"; đổi sang ngày không trùng → tag cam "Trái tuyến".

**10. Module Báo cáo (Nhóm 7)**: Sidebar > "Báo cáo" → 4 trang, mỗi trang chỉ có tiêu đề + khung trống (đúng như thiết kế, chưa có dữ liệu — dành cho Nhi gắn PowerBI).

**11. Kiểm tra hồi quy** (đảm bảo không phá vỡ tính năng cũ): Sales Order tạo/xác nhận đơn bình thường (dùng bảng giá bán) vẫn chạy đúng như trước; trang Khách hàng vẫn Thêm/Sửa được (không còn field Nhóm khách hàng, đã chuyển sang M:N); trang Chi nhánh Thêm/Sửa vẫn hoạt động bình thường kèm 2 field mới Quản lý/NVBH mặc định (không bắt buộc).
