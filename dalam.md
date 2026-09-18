# Tổng hợp những gì đã làm

Đối chiếu theo file `NGHIEP-VU-DMS-THAM-CHIEU.html` (5 nhóm module trong phạm vi đồ án: MDM, Inventory, Sales Order, Purchase Order, Quản trị).

## ✅ Trạng thái tổng thể (đã rà soát lại toàn bộ)

**Tất cả các module ghi trong `tonghop.md` đều đã code xong** (8/8 mục, toàn bộ đánh dấu `[x]`). Vừa kiểm tra lại toàn hệ thống lần cuối (2026-09-18):
- Build backend (Maven) sạch, không lỗi.
- Build frontend (Vite) sạch, không lỗi.
- Database đã chạy đủ 31 migration (V1→V31), Hibernate `ddl-auto: validate` pass (nghĩa là toàn bộ entity Java khớp đúng với schema thật trong DB).
- Quét qua **~40 API chính** của mọi module (Danh mục, Tồn kho, Bán hàng, Mua hàng, Hệ thống) bằng lệnh gọi API thật sau khi đăng nhập — tất cả trả về đúng, không lỗi 500.
- Backend + Frontend đang chạy sẵn: backend `http://localhost:8080`, frontend `http://localhost:5173`.
- Code đã commit đủ vào git (nhánh `feature/backend-frontend`, **5 commit local chưa push** — xem bên dưới), chỉ còn `hinhanh/` (ảnh tham khảo) chưa track, không phải code.

## 🔧 Đã fix: trang Tồn kho báo "No data" (2026-09-18)

Người dùng test thật gặp trang Tồn kho trống ở cả 2 chi nhánh (CN-BD và CN_HN). Root cause (đã verify qua API, không phải bug code):
- Trang Tồn kho ghép `sản phẩm được gán cho chi nhánh` (Item-Branch Assignment) **×** `kho thuộc chi nhánh đó` — thiếu 1 trong 2 là ra bảng trống dù bảng `stock` thật vẫn có dữ liệu.
- Dữ liệu test lúc đó: chi nhánh CN-BD có 2 kho nhưng **0 sản phẩm được gán**; chi nhánh CN_HN có 1 sản phẩm gán nhưng **0 kho**.

Đã tự tạo dữ liệu test để fix (không sửa code, chỉ là thiếu bước setup dữ liệu):
- Gán toàn bộ 14 sản phẩm cho chi nhánh CN-BD.
- Tạo thêm 1 kho `KHO-CHINH-HN` cho chi nhánh CN_HN + gán 5 sản phẩm cho chi nhánh này.
- Verify lại: CN-BD giờ hiện đủ 28 dòng (14 SP × 2 kho), CN_HN hiện 6 dòng (6 SP × 1 kho).
- Test round-trip trực tiếp qua API: tạo đơn hàng bán CP001 x5 → Xác nhận → tồn giảm đúng 40→35; tạo phiếu nhập SP001 x20 → Duyệt → tồn tăng đúng 0→20. Cả 2 luồng trừ/cộng kho đều đúng.
- Quét lại toàn bộ ~40 API chính (đợt trước dùng nhầm vài path cũ như `/vendors`, `/sales/returns` — đã sửa lại đúng path thật `/suppliers`, `/sales-returns`,... tất cả đều OK, không có bug thật nào mới).

**Ghi nhớ cho lần tạo sản phẩm/chi nhánh mới sau này**: sau khi thêm sản phẩm hoặc chi nhánh mới, phải vào trang **Sản phẩm** (`/products`) → mở sản phẩm → tab **Phân bổ chi nhánh** → gán cho (các) chi nhánh sẽ bán, thì trang Tồn kho mới hiện ra được. Đây không phải bug, là bước nghiệp vụ bắt buộc (giống DMS thật: sản phẩm phải "active" tại chi nhánh mới bán được ở đó).

## 🗑️ Đã xóa hẳn sản phẩm Coca Cola (SP001) khỏi DB (2026-09-18)

Theo yêu cầu: công ty chỉ dùng hàng Orion, xóa hẳn Coca Cola (không phải chỉ gỡ khỏi chi nhánh). Sản phẩm này lúc đó đang bị tham chiếu bởi khá nhiều chứng từ thật đã phát sinh trong lúc test (không chỉ dữ liệu tôi mới tạo), nên xóa dây chuyền qua SQL trực tiếp (không sửa code):
- Xóa các dòng liên quan ở 9 bảng: `stock_transaction`, `stock`, `item_branch`, `invoice_item`, `purchase_return_item`, `sales_return_item`, `goods_receipt_detail`, `sales_order_detail`, `price_list_item`.
- Với chứng từ chỉ có Coca Cola là dòng duy nhất → xóa luôn cả chứng từ đó (1 phiếu nhập, 1 hóa đơn, 1 phiếu trả hàng bán, 1 phiếu trả hàng NCC, 3 đơn hàng bán rỗng).
- Với chứng từ có thêm sản phẩm khác (1 đơn hàng bán, 3 bảng giá) → chỉ xóa dòng Coca Cola, giữ nguyên phần còn lại.
- Cuối cùng xóa dòng `product` Coca Cola. Toàn bộ chạy trong 1 transaction SQL (`START TRANSACTION` → `COMMIT`).

**Test lại sau khi xóa** (yêu cầu tường minh của người dùng): quét lại đủ ~40 API chính — tất cả OK, số lượng bản ghi mỗi bảng đổi đúng như tính toán (vd `/products` 14→13, `/sales-orders` 8→5, `/invoices` 3→2...). Test round-trip thêm 1 lần nữa với sản phẩm Orion (CP001): tạo đơn hàng → Xác nhận → tồn kho giảm đúng 35→33. Không phát sinh lỗi nào sau khi xóa.

Danh sách 13 sản phẩm còn lại đều là hàng Orion, **trừ 2 dòng rác test cũ** không thuộc Orion: `TEST02` (tên bị lỗi encoding) và `sssss` (id=18, rõ ràng là dữ liệu test/rác) — chưa xóa vì người dùng chỉ yêu cầu xóa Coca Cola, để lại chờ quyết định riêng.

## 🆕 Thêm tính năng: lưu "Người xác nhận đơn hàng" (2026-09-18)

Yêu cầu: đơn hàng bán trước đây chỉ lưu `created_by` (ai tạo đơn), không lưu ai bấm Xác nhận (xuất kho). Đã thêm:

- **Backend**: migration `V32__sales_order_confirmed_by.sql` thêm cột `sales_order.confirmed_by` (FK → `user`, nullable). Entity `SalesOrder` thêm field `confirmedBy`. `SalesOrderService.confirm()` set `order.setConfirmedBy(currentUser())` ngay khi xác nhận — null khi đơn còn PENDING/CANCELLED.
- **Frontend**: `TableToolbar` thêm slot mới `betweenReloadExport` (nằm giữa nút Làm mới và Xuất file). Trang **Đơn hàng bán** dùng slot này để thêm 1 icon người (👤) — bấm vào mở Modal liệt kê toàn bộ đơn hàng kèm cột "Người xác nhận" (tên người bấm Xác nhận, "-" nếu chưa xác nhận).

**Đã test**: build backend + frontend sạch, restart backend (migration V32 áp dụng thành công, DB lên v32). Tạo đơn mới → xác nhận → gọi lại API thấy `confirmedBy` đúng là user đang đăng nhập (`admin`/`Test Admin`), trước khi xác nhận field này là `null`. Quét lại đủ 40 API chính, không có lỗi nào.

**Cách test trên UI**: vào Đơn hàng bán → tạo 1 đơn mới → bấm Xác nhận → bấm icon người (giữa Làm mới và Xuất file trên toolbar) → Modal hiện ra phải thấy đúng tên tài khoản đang đăng nhập ở cột "Người xác nhận" cho đơn vừa xác nhận, các đơn còn PENDING hiện "-".

## 📝 [ĐÃ SỬA LẠI - xem mục bên dưới] Quyết định thiết kế (2026-09-18, không còn hiệu lực)

> **Cập nhật ngay sau đó cùng ngày**: sau khi cân nhắc lại, đã quyết định **tách lại thật** thay vì giữ gộp — xem mục "🔀 Tách lại Đơn giao hàng + Xác nhận giao hàng thành module thật" bên dưới. Giữ đoạn dưới đây lại chỉ để lưu vết quá trình quyết định (đã KHÔNG áp dụng).

Có ý kiến phản biện (từ Nhi, dựa theo nghiệp vụ DMS thật): nếu gộp "Xác nhận giao hàng" thẳng vào nút "Xác nhận" của Đơn hàng bán thì mất khả năng xử lý các tình huống giao hàng thực tế — giao thiếu số lượng, hàng hư/vỡ trong quá trình vận chuyển, khách hàng từ chối nhận hàng. Đây là rủi ro thật khi bảo vệ đồ án nếu giám khảo hỏi sâu vào nghiệp vụ.

Ban đầu chọn hướng giữ gộp, dùng module Trả hàng xử lý ngoại lệ để đỡ tốn công. Sau đó xem lại và quyết định tách hẳn cho đúng bản chất nghiệp vụ, xem chi tiết bên dưới.

## 🔀 Tách lại "Đơn giao hàng" + "Xác nhận giao hàng" thành module thật, độc lập với Đơn hàng bán (2026-09-18)

Đảo ngược quyết định gộp ở trên theo yêu cầu — tách lại đúng theo chuỗi chứng từ gốc của DMS (đã ghi rõ trong `NGHIEP-VU-DMS-THAM-CHIEU.html` dòng 268: `Sales Request → Sale Orders → Delivery Orders → Invoices`, và chính file này cũng ghi nhận việc gộp trước đó là "đồ án rút gọn" có chủ đích chứ không phải lỗi).

**Thiết kế mới — 3 bước thật, tách bạch, dùng chung logic `StockService` như mọi module khác:**
1. **Đơn hàng bán** — bấm "Xác nhận": **chỉ duyệt đơn** (PENDING → CONFIRMED), **không trừ kho nữa**. Tag trạng thái đổi "Đã xuất kho" → "Đã duyệt".
2. **Đơn giao hàng** (`/sales/delivery-orders`, bảng mới `delivery_order` + `delivery_order_item`) — tạo từ 1 đơn hàng bán đã duyệt (mỗi đơn tối đa 1 Đơn giao hàng), số lượng mặc định copy từ số lượng đặt nhưng **cho sửa lại trước khi xác nhận** để phản ánh số lượng giao thực tế (đúng tình huống "giao thiếu" Nhi nêu). Sửa/xóa được khi còn ở trạng thái "Chờ giao" (DRAFT).
3. **Xác nhận giao hàng** (`/sales/delivery-confirm`) — màn hình riêng dạng worklist, chỉ hiện các Đơn giao hàng đang chờ, bấm "Xác nhận giao hàng" mới thực sự trừ tồn kho (`StockService.decrease`, referenceType `DELIVERY_ORDER`) đúng theo số lượng đã khai báo ở bước 2. Tách riêng màn hình này với "Đơn giao hàng" đúng theo đúng pattern 2-màn-hình-khác-vai mà chính DMS gốc dùng cho "Goods Receipt PO Confirmation" (người tạo lệnh và người xác nhận xuất kho là 2 vai khác nhau).
4. **Kết quả giao hàng** (`/sales/delivery-results`) — đổi nguồn dữ liệu từ Đơn hàng bán (CONFIRMED) sang Đơn giao hàng (CLOSED = đã xác nhận giao) — giờ đúng nghĩa "đã giao xong", kèm cột "Người xác nhận".
5. **Hóa đơn** — chặn xuất hóa đơn nếu đơn hàng **chưa có Đơn giao hàng đã xác nhận**; số lượng chốt trên hóa đơn lấy theo **số lượng giao thực tế** (Đơn giao hàng), không lấy theo số lượng đặt — nếu giao thiếu thì hóa đơn cũng chỉ tính đúng phần đã giao.

**Backend**: migration `V33__delivery_order.sql` (bảng `delivery_order`, `delivery_order_item`, seed numbering config `DELIVERY_ORDER`/`DO`). Entity/DTO/Repository/Service/Controller mới `DeliveryOrder*` (package `sales`). `SalesOrderService.confirm()` bỏ hết phần trừ kho. `InvoiceService.createFromSalesOrder()` đổi sang đọc `DeliveryOrder` (yêu cầu status CLOSED) và build `invoice_item` từ `DeliveryOrderItem` (số lượng thực giao) + đơn giá vẫn lấy từ `SalesOrderDetail` gốc.

**Frontend**: 2 trang mới `pages/sales/DeliveryOrder` (CRUD Đơn giao hàng, chọn Đơn hàng bán đã duyệt, sửa số lượng giao) và `pages/sales/DeliveryConfirm` (worklist xác nhận). `AppRoutes.jsx` thay 2 `PlaceholderPage` mock bằng 2 trang thật này. `SalesOrder/index.jsx` đổi tag trạng thái, nội dung Popconfirm, và điều kiện hiện nút "Xuất hóa đơn" (giờ theo Đơn giao hàng đã xác nhận thay vì theo trạng thái đơn hàng). `DeliveryResults/index.jsx` đổi nguồn dữ liệu như trên.

**Đã test thật (API, sau khi restart backend áp dụng V33)**:
- Tạo đơn hàng bán CP001 x4 → Xác nhận → tồn kho **không đổi** (32 → 32, đúng thiết kế mới).
- Thử xuất hóa đơn khi chưa có Đơn giao hàng → bị chặn đúng như kỳ vọng (409, thông báo rõ ràng).
- Tạo Đơn giao hàng từ đơn đó (tự copy số lượng đặt = 4) → sửa lại còn 3 (mô phỏng giao thiếu) → Xác nhận giao hàng → tồn kho giảm đúng 3 (32 → 29), không phải 4.
- Xuất hóa đơn sau khi đã xác nhận giao → thành công, số lượng trên hóa đơn đúng là 3 (số giao thực tế), tổng tiền đúng 45.000đ (3 × 15.000đ). Xuất hóa đơn lần 2 cho cùng đơn → bị chặn đúng như cũ.
- Build backend + frontend sạch, quét lại 26 API chính không lỗi.

**Cách test trên UI**: Đơn hàng bán → tạo đơn mới → Xác nhận (tag chuyển "Đã duyệt", tồn kho chưa đổi) → vào **Đơn giao hàng** → Tạo đơn giao hàng, chọn đúng đơn vừa duyệt, sửa thử 1 dòng số lượng ít hơn số đặt (mô phỏng giao thiếu) → Lưu → vào **Xác nhận giao hàng** → thấy đơn vừa tạo ở trạng thái "Chờ xác nhận" → bấm Xác nhận giao hàng → vào **Tồn kho** kiểm tra đã giảm đúng số lượng vừa khai (không phải số đặt ban đầu) → quay lại Đơn hàng bán bấm "Xuất hóa đơn" → kiểm tra số lượng trên hóa đơn đúng bằng số đã giao.

## 🧪 Hướng dẫn test toàn hệ thống (đi 1 lượt từ đầu đến cuối)

Thứ tự dưới đây đi theo đúng luồng nghiệp vụ thật (tạo danh mục → nhập/xuất kho → bán hàng → mua hàng → quản trị), mỗi bước chỉ vài phút. Đăng nhập bằng tài khoản ADMIN (`admin`/`admin123`) để thấy đủ mọi menu.

**Bước 0 — Đăng nhập**: mở `http://localhost:5173`, đăng nhập → phải thấy đủ nút Thêm/Sửa/Xóa ngay lần đầu (không cần F5) ở mọi trang danh mục.

**Bước 1 — Chọn chi nhánh**: góc trái Header có badge chi nhánh (Branch Selector) → bấm vào, thử tìm/chọn 1 chi nhánh khác. Vào Danh mục > Company Setup > Chi nhánh → thử **Thêm chi nhánh mới** → vào Tồn kho > Kho, lọc theo chi nhánh vừa tạo → phải thấy tự sinh đúng 3 kho (kho chính/kho xe tải/kho hàng lỗi).

**Bước 2 — Danh mục sản phẩm**: vào Sản phẩm → thêm/sửa 1 sản phẩm, kiểm tra đủ 3 tab Purchase/Sale/Inventory (mỗi tab 1 đơn vị tính + 1 nhóm thuế). Vào Bảng giá → thêm 1 bảng giá loại "Bán", gán giá cho sản phẩm đó.

**Bước 3 — Nhập hàng (Purchase Order)**: vào Tồn kho > Nhập hàng → tạo phiếu nhập, chọn nhà cung cấp + kho + sản phẩm → Xác nhận → tồn kho phải tăng đúng số lượng. Thử vào Purchase Order > Trả hàng NCC → tạo phiếu trả 1 phần hàng vừa nhập → Duyệt → tồn kho phải giảm lại đúng số lượng trả.

**Bước 4 — Bán hàng (Sales Order)**: vào Sales Order > Sale Orders → tạo đơn hàng, chọn khách hàng (đã gán tuyến) + kho + sản phẩm → hệ thống tự báo "Đúng tuyến/Trái tuyến" và tự tra giá bán → Xác nhận đơn → tồn kho phải giảm đúng số lượng đã bán. Thử tạo thêm vài đơn rồi dùng **"Xác nhận hàng loạt"** để duyệt nhiều đơn cùng lúc.

**Bước 5 — Sau bán hàng**: từ 1 đơn đã xác nhận → bấm **"Xuất hóa đơn"** (kiểm tra tiền thuế tính đúng) → vào Sales Order > Invoices xem lại. Vào Sales Order > Returns → tạo phiếu trả hàng của khách → Duyệt → tồn kho phải tăng lại. Vào Picking List → in thử 1 đơn.

**Bước 6 — Kiểm kê & điều chuyển kho**: vào Tồn kho > Kiểm kê kho, và Tồn kho > Chuyển hàng tồn kho (thử đủ 2 bước: kho nguồn xác nhận xuất → kho đích xác nhận nhận).

**Bước 7 — Quản trị (chỉ ADMIN thấy)**: vào Hệ thống > Nhật ký đăng nhập (xem lại các lần đăng nhập vừa test). Vào Quản lý thiết bị đăng nhập → thử thu hồi phiên hiện tại của mình → xác nhận bị đăng xuất ngay → đăng nhập lại bình thường (không bị khóa vĩnh viễn). Vào Cấu hình đánh số chứng từ xem số phiếu tự sinh cho từng loại.

**Bước 8 — Báo cáo**: vào Báo cáo → 4 trang chỉ có khung trống (đúng thiết kế, để dành cho bạn Nhi gắn PowerBI, không phải lỗi thiếu dữ liệu).

Chi tiết test từng module cụ thể hơn (kể cả các rule validate phức tạp như Route 2 timeline) xem các mục "Cách test..." bên dưới trong file này.

## 📋 Checklist test chi tiết TOÀN BỘ menu (Danh mục + Hệ thống + các nhóm khác)

Đi đúng theo thứ tự Sidebar hiện tại, từng mục một. Với các danh mục đơn giản (chỉ Thêm/Sửa/Xóa, không có nghiệp vụ đặc biệt) chỉ cần: **Thêm 1 dòng mới → Sửa lại → Xóa** — nếu cả 3 thao tác không báo lỗi và bảng cập nhật đúng là đạt, không cần lặp lại hướng dẫn cho từng mục.

### Nhóm "Danh mục"

**Vùng địa lý** (Vùng → Tỉnh/Thành phố → Quận/Huyện → Phường/Xã): test CRUD cơ bản từng cấp; khi thêm Tỉnh phải chọn được Vùng cha, thêm Quận phải chọn được Tỉnh cha (dropdown lọc theo cấp cha đã chọn) — xác nhận cascading đúng.

**Sales Organization > Vùng bán hàng**: CRUD cơ bản.

**Company Setup**:
- *Công ty*: chỉ 1 bản ghi duy nhất (singleton) — chỉ Sửa được, không có nút Thêm/Xóa.
- *Nhà cung cấp*: CRUD cơ bản, chú ý nhãn trạng thái đã đổi thành "Hoạt động" (không còn "Kích hoạt").
- *Chi nhánh*: Thêm chi nhánh mới → xác nhận **tự động sinh 3 kho** (vào Tồn kho > Kho kiểm tra); form có thêm 2 field "Quản lý mặc định"/"NVBH mặc định" (không bắt buộc).

**Sản phẩm**:
- *Sản phẩm*: Thêm/Sửa → phải thấy đủ 3 tab **Purchase/Sale/Inventory**, mỗi tab chọn Đơn vị tính + Nhóm thuế riêng (Đơn vị tính lọc theo Nhóm quy đổi đã chọn phía trên) — không còn field "Giá" hay "Đơn vị tính (cũ)".
- *Thuộc tính* (ProductCategory cũ, đã đổi tên hiển thị): CRUD cơ bản, có thể chọn Thuộc tính cha (phân cấp cha/con).
- *Nhóm sản phẩm* (mới, M:N): Thêm 1 nhóm → bấm nút "Sản phẩm" trên dòng vừa tạo → thêm/gỡ sản phẩm vào nhóm (Master-Detail).
- *Đơn vị tính*: có 2 tab con "Đơn vị tính" và "Nhóm quy đổi" — thêm 1 Nhóm quy đổi, thêm quy đổi (VD 1 Thùng = 24 Hộp) bên trong.
- *Nhóm thuế*: CRUD cơ bản, có field % thuế suất.

**Bảng giá**: Thêm bảng giá, Loại chọn "Bảng giá mua" hoặc "Bảng giá bán" → bấm "Giá sản phẩm" trên dòng vừa tạo → gán giá cho từng sản phẩm+đơn vị tính. Thử xóa 1 dòng giá của sản phẩm đang được phân bổ cho 1 chi nhánh nào đó (Item-Branch Assignment) → phải bị chặn xóa (chỉ cho sửa).

**Khách hàng**:
- *Khách hàng*: CRUD cơ bản, có chọn Kênh bán hàng + Bảng giá + địa chỉ theo Vùng địa lý.
- *Nhóm khách hàng* (M:N): giống Nhóm sản phẩm — thêm nhóm → bấm nút quản lý khách hàng trong nhóm.
- *Kênh bán hàng*: CRUD cơ bản.

**Nhân viên**:
- *Nhân viên*: 2 tab "Nhân viên bán hàng"/"Nhân viên quản lý" — mỗi tab CRUD riêng, đủ field hồ sơ (SĐT, CCCD, ngày sinh...). Tab NVBH có thêm checkbox "Kiêm giao hàng". Có thể gán tài khoản đăng nhập (không bắt buộc).
- *Chức vụ*, *Loại nhân viên bán hàng*: CRUD cơ bản.

**Route & MCP > Khung tuyến**: Thêm 1 khung tuyến (chọn Vùng bán hàng, Chi nhánh) → bấm nút **"Nhân sự"** → test kỹ 2 tab timeline độc lập NVBH/Quản lý (thêm phân bổ, đóng phân bổ để đổi người, thử chồng thời gian phải bị chặn) → bấm nút **"Khách hàng"** → thêm khách hàng vào tuyến kèm thứ tự ghé thăm + lịch thứ/tuần, thử thêm 1 khách đã có tuyến khác phải bị chặn.

### Nhóm "Bán hàng (Sales Order)"

- *Đơn hàng bán*: CRUD + Xác nhận (trừ tồn kho) + Hủy đơn. Thử chọn khách hàng đã gán tuyến → xem tag "Đúng tuyến"/"Trái tuyến" + cảnh báo sai chi nhánh. Tick chọn nhiều đơn "Chờ xác nhận" → nút "Xác nhận hàng loạt" xuất hiện, test xác nhận nhiều đơn cùng lúc.
- *Hóa đơn*: từ 1 đơn đã xác nhận, bấm nút xuất hóa đơn (ở trang Đơn hàng bán) → vào đây xem lại, kiểm tra tiền thuế đúng theo % Nhóm thuế của sản phẩm. Thử xuất hóa đơn 2 lần cho cùng 1 đơn → phải báo lỗi.
- *Trả hàng*: Thêm phiếu, Duyệt → tồn kho phải **tăng**.
- *Phiếu soạn hàng / In phiếu giao hàng*: chọn 1 đơn đã xác nhận → In thử (chỉ hiện nội dung phiếu, không có Sidebar/Header khi in).
- *Kết quả giao hàng*: chỉ xem danh sách đơn đã xác nhận, không có thao tác.
- Các mục còn lại (*Yêu cầu bán hàng, Đơn giao hàng, Xác nhận giao hàng, Phiếu ghi có, Tạo chứng từ, Phiếu in nhanh, In chứng từ, Yêu cầu trả hàng, Khai thuế TNCN hoa hồng*): chỉ là khung trống (đã gộp chức năng vào các mục trên hoặc chủ động không làm) — vào xem có hiện trang là đạt, không cần thao tác gì thêm.

### Nhóm "Tồn kho"

- *Tồn kho*: chỉ xem, tự lọc theo chi nhánh đang chọn ở Header — đổi chi nhánh xem danh sách có đổi theo không.
- *Kho*: CRUD, cũng tự lọc theo chi nhánh ở Header.
- *Nhập hàng*: CRUD + Xác nhận → tồn kho tăng.
- *Phiếu xuất kho*: CRUD + Xác nhận → tồn kho giảm. Thử xuất số lượng lớn hơn tồn kho hiện có → phải báo lỗi, không cho âm kho.
- *Chuyển hàng tồn kho* + *Xác nhận di chuyển hàng tồn kho*: tạo phiếu ở trang đầu (kho nguồn xác nhận xuất, tồn kho nguồn giảm ngay) → qua trang thứ 2 xác nhận nhận (tồn kho đích mới tăng).
- *Kiểm kê kho*: CRUD + Duyệt, kiểm tra chênh lệch ghi nhận đúng vào lịch sử tồn kho.

### Nhóm "Mua hàng (Purchase Order)"

- *Phiếu nhập hàng mua*: trỏ thẳng về trang Nhập hàng ở trên (không phải trang riêng, dữ liệu dùng chung).
- *Trả hàng NCC*: Thêm phiếu, Duyệt → tồn kho phải **giảm**. Chỉ ADMIN/Quản lý kho mới Thêm/Sửa/Xóa/Duyệt được (nhân viên bán hàng chỉ xem).
- *Yêu cầu mua hàng*, *Nhật ký tự động đặt hàng*: khung trống, không cần thao tác.

### Nhóm "Hệ thống" (chỉ ADMIN thấy)

- *Người dùng*, *Phân quyền*: CRUD tài khoản/role như bình thường.
- *Nhật ký đăng nhập*: chỉ xem, kiểm tra có ghi đủ các lần đăng nhập vừa test (cả đúng lẫn sai mật khẩu), không hiện mật khẩu.
- *Cấu hình đánh số chứng từ*: xem số hiện tại + số tiếp theo của 8 loại chứng từ, thử sửa 1 tiền tố rồi tạo phiếu mới kiểm tra số theo tiền tố mới.
- *Quản lý thiết bị đăng nhập*: xem danh sách phiên đang đăng nhập, thử **thu hồi phiên hiện tại của chính mình** → xác nhận bị đăng xuất ngay lập tức → đăng nhập lại bình thường (đây là bước quan trọng nhất, vì đụng vào hạ tầng xác thực dùng chung cho mọi request).
- *Quy trình duyệt*, *Cài đặt hệ thống*: CRUD cấu hình đơn giản, chỉ lưu trữ/hiển thị, chưa thực sự áp dụng vào luồng nghiệp vụ (đúng như thiết kế).
- *Cấu hình Email*: lưu thử cấu hình SMTP, dùng tab "Gửi thử" → chỉ tạo 1 dòng trong Nhật ký email bên dưới, không có email thật nào được gửi đi.

### Nhóm "Báo cáo"

4 trang (BC bán hàng/kho/mua hàng/danh mục): chỉ có tiêu đề + khung trống — đúng thiết kế dành cho khung PowerBI của Nhi, không phải thiếu sót.

## Lưu ý quan trọng
- Có 3 lỗi thật được tìm ra và sửa trong lúc test (không chỉ dựa vào code sạch/build sạch): 1 lỗi `LazyInitializationException` ở API tra tuyến khách hàng, và 2 lỗi liên quan transaction khi đăng nhập (xem chi tiết ở mục Quản trị bên dưới). Cả 3 đã test lại xác nhận hết lỗi.
- Nếu tắt/mở lại máy hoặc Docker, nhớ đảm bảo container MySQL (`erp-mysql-oltp`) đang chạy trước khi khởi động lại backend — Flyway sẽ tự áp migration còn thiếu, không cần thao tác tay.

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

✅ Đã gộp chuỗi Sales Request → Sale Order → Delivery Order thành 1 bảng `sales_order`, xác nhận đơn = xuất kho luôn. Tự động tra giá qua Price List khi chọn sản phẩm. Sidebar tái cấu trúc đủ 15 mục giống OMS thật. Đã thêm mới: **Returns** (trả hàng, cộng lại tồn kho), **Invoices** (xuất hóa đơn, chốt thuế), **Picking List/Delivery Note** (in phiếu), **Mass Process Delivery** (xác nhận hàng loạt), **Delivery Results**.

## Purchase Order (Mua hàng)

✅ Đã gộp Purchase Request + Goods Receipt PO vào Goods Receipt. Đã thêm mới: **Goods Return** (trả hàng NCC, trừ lại tồn kho, quyền riêng ADMIN+WAREHOUSE_MANAGER).

## Quản trị

✅ Users (kèm Chi nhánh/Chức vụ/Loại NVBH), Roles/Permissions. Đã thêm mới 6 mục: **Security Logs** (nhật ký đăng nhập), **Numbering Configs** (nơi duy nhất sinh số phiếu cho mọi loại chứng từ), **Login Device Management** (xem/thu hồi phiên đăng nhập), **Approval Process** (cấu hình tham khảo), **Settings**, **Email Config** (giả lập, không gửi thật).

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
- Trang "Kho" (`/warehouses`) và trang "Tồn kho" (đổi tên từ "Báo cáo tồn kho") đều tự lọc theo Branch Selector ở Header (đã bỏ bộ lọc Chi nhánh riêng ở trang Kho theo yêu cầu, đồng nhất UX). Trang Tồn kho: chỉ hiện SP thuộc chi nhánh đó × 3 kho của chi nhánh, luôn đủ 3 dòng/SP kể cả tồn = 0, cột "Kho" đổi thành "Loại kho".

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

Toàn bộ các module trong `tonghop.md` đã code xong (tính đến bản cập nhật này). Phần chủ động bỏ (không nằm trong phạm vi đồ án):

- POSM Inventory — thuộc Trade Marketing, chủ động bỏ.
- Batch Management, Promotions — chủ động bỏ theo bảng đối chiếu trong file DMS reference.
- Sales Order: Sales Request/Delivery Orders/Delivery Confirm/Document Generation/Printed Note (Express)/Document Printing/Van Sales Daily Payment/Upload VAT & PIT of Incentive — chỉ dựng khung Sidebar (PlaceholderPage) cho đủ hình thức 15 mục, không có logic thật (lý do chi tiết xem `tonghop.md`).
- Purchase Order: Auto RPO log/SKU Target Setup — chủ động bỏ (cần hạ tầng lập lịch riêng, "SKU Target Setup" trùng bản chất với Stock Alerts đã có).
- Quản trị: Numbering Configs chỉ áp dụng cho các module tự sinh số phiếu tự động hiện có, chưa mở rộng cho các module khác nếu phát sinh sau này. Approval Process/Email Config chỉ là cấu hình/giả lập, chưa thực sự chặn logic hay gửi email thật (đúng như quyết định đã chốt để giảm rủi ro).

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

## Cách test đợt "Sales Order Returns/Invoices" + "Purchase Order Goods Return" + "Quản trị 6 mục"

**Trước khi test**: chạy lại backend 1 lần để Flyway tự áp V22→V31 (đã tự test migrate sạch, không cần thao tác tay với DB).

**1. Sales Order — Returns**: Sidebar > Sales Order > "Returns" → Thêm phiếu trả hàng, chọn khách hàng + kho nhận trả + ít nhất 1 dòng sản phẩm → Lưu → bấm nút dấu tích để Duyệt → vào trang Tồn kho kiểm tra số lượng sản phẩm đã **tăng** đúng bằng số lượng trả.

**2. Sales Order — Invoices**: mở 1 đơn hàng đã **CONFIRMED** (đã xuất kho) trên trang Sales Order → thấy nút hình tờ giấy (Xuất hóa đơn) ở cột Thao tác (chỉ hiện khi đơn CONFIRMED và chưa có hóa đơn) → bấm, xác nhận → vào Sidebar > Sales Order > "Invoices" xem lại, kiểm tra tiền thuế = tiền hàng × % thuế của sản phẩm (sản phẩm có Nhóm thuế 10% thì thuế phải đúng 10%). Thử bấm "Xuất hóa đơn" lần 2 cho cùng đơn đó → phải báo lỗi (không cho xuất trùng).

**3. Sales Order — Mass Process Delivery**: trang Sales Order, tick chọn nhiều đơn đang "Chờ xác nhận" (checkbox đầu dòng — đơn đã xong/đã hủy không tick được) → nút "Xác nhận hàng loạt (N)" hiện ra phía trên bảng → bấm → xác nhận → các đơn đủ tồn kho sẽ chuyển "Đã xuất kho", đơn nào thiếu tồn kho sẽ báo lỗi riêng (xem popup) mà không chặn các đơn còn lại.

**4. Sales Order — Picking List & Delivery Results**: "Picking List/Delivery Note Printing" → chọn 1 đơn CONFIRMED, bấm "In phiếu" → xem trước phiếu giao hàng, bấm "In" sẽ mở hộp thoại in của trình duyệt (chỉ có nội dung phiếu, không có Sidebar/Header). "Delivery Results" → chỉ hiển thị danh sách đơn đã CONFIRMED kèm ngày xác nhận.

**5. Purchase Order — Goods Return**: Sidebar > Purchase Order > "Trả hàng NCC" → Thêm phiếu, chọn NCC + kho xuất trả + sản phẩm → Lưu → Duyệt → vào Tồn kho kiểm tra số lượng đã **giảm** đúng bằng số lượng trả.

**6. Quản trị — Security Logs**: đăng xuất rồi đăng nhập lại (cả trường hợp đúng và sai mật khẩu) → vào Sidebar > Hệ thống > "Nhật ký đăng nhập" → phải thấy đủ các lần vừa thử, đúng cột Thành công/Thất bại, không có cột mật khẩu.

**7. Quản trị — Numbering Configs**: vào "Cấu hình đánh số chứng từ" → xem danh sách 8 loại chứng từ với số hiện tại + số tiếp theo dự kiến → sửa thử 1 tiền tố (VD đổi "SO" thành "DH") → Lưu → tạo 1 đơn hàng mới → số phiếu phải theo tiền tố mới, không trùng với các phiếu cũ.

**8. Quản trị — Login Device Management (quan trọng nhất, ảnh hưởng đăng nhập)**: vào "Quản lý thiết bị đăng nhập" → thấy danh sách phiên đang đăng nhập (thiết bị/IP/thời gian) → bấm "Đăng xuất" trên phiên hiện tại của chính bạn → **ngay lập tức các thao tác tiếp theo trong app sẽ báo lỗi hết hạn phiên** (đây là hành vi đúng — đã bị thu hồi) → đăng nhập lại bình thường → mọi chức năng khác hoạt động lại như cũ (không bị khóa vĩnh viễn).

**9. Quản trị — Approval Process/Settings/Email Config**: 3 trang CRUD đơn giản, thêm/sửa/xóa 1 dòng thử để xác nhận hoạt động. Riêng Email Config: vào tab "Gửi thử", điền người nhận rồi bấm "Gửi thử" → chỉ xuất hiện 1 dòng trong bảng "Nhật ký email" bên dưới (không có email thật nào được gửi đi, đúng như thiết kế).

**10. Kiểm tra hồi quy tổng thể** (bắt buộc sau khi sửa `JwtAuthFilter` — điểm rủi ro cao nhất session này): sau khi test xong mục 8, đăng nhập lại và thử qua 1 lượt các trang chính đã làm từ trước (Chi nhánh, Sản phẩm, Kho, Sales Order, Goods Receipt...) để chắc chắn không trang nào bị chặn nhầm.

**Lỗi thật đã tìm và sửa trong lúc test** (không chỉ dựa vào code sạch): API đăng nhập từng bị lỗi 500 "Transaction silently rolled back" sau khi thêm ghi log — nguyên nhân do transaction đang ở chế độ chỉ-đọc, đã sửa; và một lỗi hiếm khi đăng nhập liên tiếp trong cùng 1 giây (do JWT trùng token) — đã sửa bằng migration bổ sung. Cả hai đã test lại xác nhận hết lỗi.
