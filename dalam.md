# Tổng hợp những gì đã làm

Đối chiếu theo file `NGHIEP-VU-DMS-THAM-CHIEU.html` (5 nhóm module trong phạm vi đồ án: MDM, Inventory, Sales Order, Purchase Order, Quản trị).

## 🧩 Đợt nâng cấp 3 bước: Đã đặt hàng / Loại đơn / Đơn vị tính (2026-09-25)

**Bước 1 — Tồn kho, cột "Đã đặt hàng"** (chỉ sửa frontend): = tổng SL các đơn **PENDING + CONFIRMED** mà Đơn giao hàng **chưa Xác nhận** (dùng số lượng quy đổi cơ sở). Trước đây chỉ cộng PENDING nên đơn đã duyệt chờ giao không được tính giữ chỗ. *Lưu ý:* các đơn test cũ (SO0001, SO0003, "34", SO0008-10) được duyệt từ thời "Xác nhận = trừ kho" và chưa có Đơn giao hàng nên đang bị tính "đã đặt" dù kho đã trừ từ trước — chỉ là dữ liệu test cũ, không phải lỗi logic.

**Bước 2 — Trường mới (V35)**: Đơn hàng bán có **Loại đơn** (`STANDARD` / `PRE_ORDER` / `SAMPLE`) + **Ngày giao hàng**. Pre-order bắt buộc có Ngày giao và xuất từ kho loại MAIN. Đơn mẫu: ép đơn giá = 0 ở backend (vẫn trừ kho, vẫn xuất hóa đơn 0đ). **Trả hàng** đổi sang gắn **Nhân viên bán hàng (NVBH)**, bỏ Khách hàng + Đơn hàng gốc khỏi form (2 cột cũ giữ ở DB, cho phép NULL).

**Bước 3 — Đơn vị tính (V36)**: tồn kho luôn lưu theo **đơn vị cơ sở (Gói)** của nhóm quy đổi; mọi chứng từ chọn Gói/Hộp/Thùng đều qua 1 hàm quy đổi chung (`UomConversionService`) và lưu thêm `base_quantity`.
- Áp dụng cho: Yêu cầu bán hàng, Đơn hàng bán, Đơn giao hàng (thừa hưởng ĐVT từ đơn), Hóa đơn (hiển thị ĐVT, đơn giá theo ĐVT giao), Trả hàng. Trừ/cộng kho và "Đã đặt hàng" đều dùng `base_quantity`.
- **Tra giá theo ĐVT**: bảng giá có giá đúng ĐVT thì lấy thẳng; không có thì tự suy ra từ dòng giá khác (giá cơ sở = giá / hệ số, nhân hệ số ĐVT cần). VD CP001 Hộp 40.000 → Gói 3.333,33 → Thùng 480.000.
- **Hóa đơn khi giao khác ĐVT với đơn** (VD đơn 1 Thùng 720.000, giao 5 Hộp): đơn giá quy đổi 720.000/96×6 = 45.000/Hộp (đã phát hiện và sửa lỗi lấy nhầm giá Thùng cho Hộp trong lúc test).
- **Dữ liệu demo đã seed**: 4 nhóm quy đổi mới (`QC-12X12` Chocopie hộp 12/thùng 144 gói; `QC-6X16` Custas hộp 6/thùng 96; `QC-COSY` hộp 10/thùng 240; `QC-SNACK` gói/thùng 30) + Swing dùng `NHOM-BANHKEO`; gán cho 12 sản phẩm Orion (bán theo Hộp — riêng snack bán theo Gói, mua theo Thùng, tồn kho theo Gói). Bổ sung giá bán cho các sản phẩm chưa có giá vào 2 bảng giá bán hiện có (`BG-DAILY-C1`, `BG-CHUAN-CTY`).
- **Lưu ý cho người test**: tồn kho demo (100 mỗi SP) giờ hiểu là **100 gói** — 1 hộp Chocopie = 12 gói nên đặt vài hộp là hết. Phiếu nhập hàng (Goods Receipt) **chưa** có ĐVT: số nhập vào được hiểu là đơn vị cơ sở. Đơn/dòng cũ (không có ĐVT) coi như hệ số 1.

**Đã test qua API**: Pre-order thiếu ngày giao / kho Van bị chặn; Đơn mẫu đi hết chuỗi đến hóa đơn 0đ; Trả hàng bắt buộc NVBH; ĐVT sai nhóm bị chặn; Đơn 2 Hộp → base 24, xác nhận giao trừ đúng 24 (90→66); Yêu cầu bán hàng 1 Thùng → chuyển đơn giữ ĐVT; sửa Đơn giao từ 1 Thùng xuống 5 Hộp → trừ 30; Trả hàng 1 Thùng CS001 → cộng 240 vào kho Van. Frontend build sạch (chưa test được bằng trình duyệt thật trong phiên này — cần bạn thao tác thử trên UI).

## 🚚 Mô hình kho 2 tầng Main → Van (V38, 2026-09-25)

**Quy tắc (mỗi chi nhánh 1 Kho Van):**
| Bước | Kho Main | Kho Van |
|---|---|---|
| Đặt đơn / Duyệt đơn | Tồn thực tế **giữ nguyên**; "Đã đặt hàng" tăng, "Sẵn sàng bán" giảm | – |
| **Xác nhận giao hàng** (DO) | Tồn thực tế **giảm**; "Đã đặt hàng" giảm theo (đơn hết giữ chỗ) nên "Sẵn sàng bán" không đổi | Tồn thực tế **tăng** |
| **Xuất hóa đơn** | không đổi | Tồn thực tế **giảm** (hàng giao tận tay khách) |

- Kho Van của DO là kho loại VAN thuộc **cùng chi nhánh** với kho xuất; lưu ở `delivery_order.van_warehouse_id`. Mỗi chi nhánh phải có Kho Van — V38 tự tạo cho chi nhánh chưa có (CN_HN → `CN_HNVWH01`).
- **Đơn xuất thẳng từ Kho Van** (bán tại xe): xác nhận giao không chuyển kho (hàng đã nằm sẵn ở Van), "Đã đặt hàng" của Van chỉ hết khi xuất hóa đơn.
- **Đơn giao cũ** (xác nhận theo mô hình 1 tầng, `van_warehouse_id` NULL, kể cả `DO-CU-*`): hóa đơn **không trừ thêm tồn** để không trừ 2 lần.
- Công thức "Đã đặt hàng"/"Sẵn sàng bán" (backend `AvailabilityService` + trang Tồn kho) cập nhật đúng quy tắc trên.
- Đơn giao hàng chặn nếu Kho Main không đủ tồn thực tế; hóa đơn chặn nếu Kho Van không đủ tồn (Kho Van là kho chung của chi nhánh, hàng của đơn nào cũng dùng chung).

**Đã test qua API (21/21 đạt)**: đặt/duyệt/tạo đơn giao không đổi tồn; xác nhận giao 5 Hộp → Main −30, Van +30, Sẵn sàng bán không đổi; xuất hóa đơn → Van −30 (về lại như đầu), xuất lần 2 bị chặn; giao thiếu 2/5 Hộp → chuyển đúng 12 gói; chi nhánh Hà Nội dùng đúng Kho Van HN; đơn xuất từ Kho Van không chuyển kho và giữ chỗ đến khi xuất hóa đơn; hóa đơn của đơn giao cũ không đổi tồn.

## 🛡️ Dọn dữ liệu cũ, nâng tồn kho demo, chặn đặt vượt "Sẵn sàng bán" (2026-09-25)

1. **Dọn dữ liệu cũ (V37)**: 6 đơn test cũ (SO0001, SO0003, "34", SO0008, SO0009, SO0010) được duyệt từ thời "Xác nhận = trừ kho" nên đang bị tính "Đã đặt hàng" lần 2. Migration nhận diện chính xác bằng dấu vết giao dịch kho kiểu cũ (`OUT` tham chiếu `SALES_ORDER`) và tạo cho mỗi đơn 1 Đơn giao hàng đã xác nhận (`DO-CU-<id>`), **không đụng tồn kho** (kho đã trừ đúng từ trước).
2. **Tồn kho demo**: 11 sản phẩm Orion × 3 kho (Chính BD, Xe tải BD, Chính HN) = **10.000 gói** mỗi dòng, thực hiện qua 3 phiếu Kiểm kê được duyệt (KK0005-KK0007) nên lịch sử giao dịch kho vẫn khớp. Không nâng 2 sản phẩm rác `TEST02`, `sssss`.
3. **Chặn vượt tồn** (`AvailabilityService`): `Sẵn sàng bán = Tồn thực tế − Đã đặt hàng` (đơn vị cơ sở, tại kho xuất của đơn; "Đã đặt hàng" = đơn PENDING/CONFIRMED mà Đơn giao hàng chưa Xác nhận — cùng công thức với trang Tồn kho). Nếu tổng SL đặt (cộng các dòng cùng sản phẩm, đã quy đổi) lớn hơn thì báo: *"Số lượng đặt vượt quá số lượng Sẵn sàng bán hiện có trong kho! (Sản phẩm X: cần A, sẵn sàng bán B)"*. Áp dụng khi **tạo, sửa, duyệt** Đơn hàng bán (loại trừ chính đơn đang sửa/duyệt để không tự cộng dồn) và khi **Chuyển Yêu cầu bán hàng thành đơn**. Mặc định đã chọn: Yêu cầu bán hàng chỉ kiểm tra lúc chuyển thành đơn (lúc tạo chưa có kho xuất nên không tính được); Pre-order và Hàng mẫu cũng bị chặn như đơn thường.
   - **Đã test qua API**: 100 Thùng vượt tồn bị chặn; 2 dòng cùng SP cộng lại vượt bị chặn; Pre-order/Hàng mẫu vượt bị chặn; đặt đúng bằng số sẵn sàng bán thì qua, thêm 1 gói bị chặn; sửa lên A+5 bị chặn, sửa xuống A−10 qua; duyệt đơn qua; Yêu cầu 20.000 gói tạo được nhưng chuyển thành đơn bị chặn, 50 gói chuyển được.

## ⚠️ Giới hạn đã biết: Đơn giao hàng chỉ hỗ trợ 1-1 với Đơn hàng bán (không giao nhiều đợt)

`delivery_order.sales_order_id` đang là **UNIQUE** — 1 Đơn hàng bán chỉ tạo được tối đa **1 Đơn giao hàng**. Sửa số lượng ở bước "Đơn giao hàng" chỉ cho phép "giao thiếu rồi thôi" (giao 1 lần, ít hơn số đặt), **không hỗ trợ** tạo thêm Đơn giao hàng thứ 2 cho phần còn thiếu của cùng đơn (giao nhiều đợt/multiple shipments). Đã hỏi người dùng có cần sửa không — **người dùng xác nhận không cần**, giữ nguyên giới hạn này. Nếu giám khảo hỏi "giao nhiều đợt thì sao": trả lời rằng phạm vi đồ án chỉ hỗ trợ 1 đơn giao hàng/1 đơn hàng bán, muốn giao thiếu thì sửa số lượng ngay trên đơn giao hàng đó trước khi xác nhận.

## 🔀 Chuyển icon "Người xác nhận" đúng chỗ: Đơn hàng bán hiện "Người yêu cầu", Xác nhận giao hàng hiện "Người xác nhận" (2026-09-18)

Icon người (giữa Làm mới/Xuất file) trước đây ở trang **Đơn hàng bán** hiện cột "Người xác nhận" (đọc `confirmedBy` của Đơn hàng bán - tức người bấm Duyệt đơn). Theo yêu cầu, đổi lại đúng ngữ nghĩa:
- **Đơn hàng bán**: icon đó giờ đổi thành **"Người yêu cầu / tạo đơn"** — đọc `createdBy` (ai đã tạo/yêu cầu đơn đó), không còn liên quan gì đến việc duyệt/xác nhận nữa.
- **Xác nhận giao hàng** (`/sales/delivery-confirm`): thêm icon người mới (cùng vị trí, giữa Làm mới/Xuất file) — mở Modal liệt kê **toàn bộ** Đơn giao hàng (cả đang chờ lẫn đã xác nhận) kèm cột "Người xác nhận" (đọc `confirmedBy` của Đơn giao hàng - dữ liệu này backend đã có sẵn từ V33, không cần sửa gì backend, chỉ thêm UI). Bảng chính của trang vẫn chỉ hiện các đơn giao hàng đang chờ như cũ (worklist), Modal mới là chỗ xem lại lịch sử ai đã xác nhận.

**Đã test qua API**: `sales-orders[].createdBy` và `delivery-orders[].confirmedBy` đều có dữ liệu đúng (VD đơn "test1" người dùng tự tạo qua UI cũng lên đúng `confirmedBy=admin`). Build frontend sạch, không cần đổi gì backend.

## 🔁 Dựng lại "Yêu cầu bán hàng" (Sales Request) thành module thật, đứng trước Đơn hàng bán (2026-09-18)

Sau khi tách Đơn giao hàng/Xác nhận giao hàng, tiếp tục dựng lại "Yêu cầu bán hàng" (đã xóa lúc đầu) thành module thật riêng, đúng chuỗi DMS gốc đầy đủ: **Yêu cầu bán hàng (SR) → Đơn hàng bán (SO) → Đơn giao hàng (DO) → Xác nhận giao hàng → Hóa đơn**.

**Khác biệt với Đơn hàng bán**: SR chưa có kho xuất (chưa chốt lúc ghi tạm), chưa đụng gì đến tồn kho. Có nút "Chuyển thành đơn hàng" — lúc bấm mới chọn kho xuất, tạo ra 1 Đơn hàng bán mới (PENDING), SR chuyển trạng thái CONVERTED (không sửa/xóa được nữa). Từ đó luồng tiếp tục y hệt như tạo đơn trực tiếp (Xác nhận → Đơn giao hàng → Xác nhận giao hàng → Hóa đơn).

**Backend**: migration `V34__sales_request.sql` (bảng `sales_request`, `sales_request_item`, cột `sales_order.sales_request_id` để truy vết, seed numbering config `SALES_REQUEST`/`SR`). Entity/DTO/Repository/Service/Controller mới `SalesRequest*`.

**Frontend**: trang mới `pages/sales/SalesRequest` (CRUD khi còn nháp + nút Chuyển thành đơn hàng chọn kho). Route `/sales/sales-request` và mục Sidebar "Yêu cầu bán hàng" (đứng đầu nhóm Bán hàng, trước Đơn hàng bán) được đưa lại — trước đó đã bị xóa hẳn.

**Đã test qua API (chuỗi đầy đủ)**: tạo Yêu cầu bán hàng (SR0001, CP002 x6) → Chuyển thành đơn hàng (chọn kho) → sinh đơn SO0012 trạng thái PENDING, SR chuyển CONVERTED (không xóa được nữa) → Xác nhận đơn (tồn kho không đổi, 59→59) → tạo Đơn giao hàng → Xác nhận giao hàng (tồn kho giảm đúng 6, 59→53) → Xuất hóa đơn (đúng số lượng 6, tổng 120.000đ). Build backend + frontend sạch, quét lại 27 API không lỗi.

**Cách test trên UI**: Sidebar > Bán hàng > **Yêu cầu bán hàng** (mục đầu tiên) → Thêm yêu cầu, chọn khách hàng + ít nhất 1 dòng sản phẩm (không cần chọn kho) → Lưu → bấm "Chuyển thành đơn hàng" → chọn kho xuất → OK → vào **Đơn hàng bán** kiểm tra đã có đơn mới trạng thái "Chờ xác nhận", đi tiếp luồng Xác nhận → Đơn giao hàng → Xác nhận giao hàng → Xuất hóa đơn như bình thường.

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

## 🔍 Khóa Kho xuất ở Đơn giao hàng + quét lỗi "Kho chưa lọc theo Chi nhánh" toàn hệ thống + rà soát menu + check dữ liệu (2026-10-02)

**1. Đơn giao hàng — khóa cứng "Kho xuất"**: trước đây dropdown "Kho xuất" trong Modal tạo/sửa Đơn giao hàng hiện cả 4 kho (2 chi nhánh), cho chọn sai khác kho của Đơn hàng bán gốc. Đổi thành `disabled`, tự điền từ `warehouseId` của Đơn hàng bán đã chọn (tạo mới) hoặc từ `record.warehouse` (sửa đơn có sẵn) — không cho đổi tay nữa.

**2. Bug "hiện ID số thay vì tên"** ở form Sửa Đơn giao hàng (ô "Đơn hàng bán" hiện `51` thay vì `SO0010 - Bạch Hóa Xanh`): danh sách option của Select này cố tình loại các đơn đã có Đơn giao hàng (để Tạo mới không chọn trùng), nhưng khi Sửa chính đơn đó thì nó cũng bị loại theo, Select không tra được label. Sửa bằng cách luôn thêm riêng option của đơn đang sửa vào danh sách.

**3. Quét toàn bộ dropdown "Kho xuất/Kho nhập" chưa lọc theo Chi nhánh** (cùng dạng bug đã sửa trước đó ở Đơn hàng bán/Yêu cầu bán hàng) — phát hiện thêm ở **5 trang**: Phiếu nhập hàng, Trả hàng bán, Trả hàng NCC, Phiếu xuất kho, Kiểm kê. Đã lọc theo Chi nhánh đang chọn ở Header cho cả 5 trang + sửa luôn Đơn hàng bán (trước đó mới lọc lúc tạo, chưa xử lý khi Sửa đơn có kho khác chi nhánh đang chọn). Mỗi trang đều giữ riêng kho của bản ghi đang sửa (dù khác chi nhánh đang chọn) để không lặp lại bug mục 2. **Cố ý không đổi** Điều chuyển kho (Transfer — vốn là tính năng chuyển liên chi nhánh có chủ đích) và Cảnh báo tồn kho (StockAlerts — cấu hình ngưỡng toàn hệ thống, không gắn 1 chứng từ/chi nhánh).

**4. Sửa lỗ hổng "quên giữ chỗ ở Kho Van"** trong công thức "Đã đặt hàng": khi 1 đơn nguồn từ Kho Main đã có Đơn giao hàng CLOSED (hàng đã chuyển vật lý sang Kho Van, chờ xuất hóa đơn), cột "Đã đặt hàng" tại Kho Van vẫn hiện 0 — vì công thức chỉ tra theo `warehouse` gốc ghi trên đơn (vẫn là Main), không tự nhận ra hàng đã nằm ở Van. Hậu quả: Kho Van tưởng nhầm số đó là hàng rảnh, có thể bị bán tiếp cho đơn khác (van sale trực tiếp), đến lúc xuất hóa đơn cho đơn gốc mới phát hiện thiếu hàng (vẫn được `StockService.decrease` chặn không cho âm kho, chỉ là phát hiện trễ). Sửa cả backend (`SalesOrderRepository.sumCommittedBase`) và frontend (`Inventories/index.jsx`) — công thức giờ cộng thêm trường hợp "đã giao (DO CLOSED) nhưng đang nằm ở đúng kho Van đó, chưa xuất hóa đơn". **Đã test bằng dữ liệu thật**: SO0004 + SO0010 (CP002) trước sửa Đã đặt hàng tại Van = 0, sau sửa = đúng 84 (60+24); tại Main vẫn đúng 0.

**5. Dọn menu Sidebar**:
- Xóa mục **"Xử lý giao hàng hàng loạt"** — không có trang/route riêng, Link trỏ thẳng về `/sales-orders` (trùng mục "Đơn hàng bán" ngay bên trên), chỉ là mục trang trí theo menu DMS tham khảo.
- Chuyển mục **"Nhập hàng"** từ nhóm "Tồn kho" sang nhóm "Mua hàng" (đúng bản chất nghiệp vụ — là bước nhận hàng từ NCC, song song với "Đơn giao hàng" bên Bán hàng) — đồng bộ cả breadcrumb và parent-key mapping.
- Xóa mục **"Yêu cầu trả hàng"** — trang Placeholder của nó tự ghi rõ "(đã gộp vào Trả hàng)", tức đã lỗi thời từ trước, xóa cả menu lẫn route.
- **Câu hỏi còn để ngỏ, chưa quyết định**: mục "Nhà cung cấp" hiện đang nằm chung nhóm "Company Setup" với "Công ty"/"Chi nhánh" (cấu hình nội bộ), trong khi về bản chất nó là đối tác bên ngoài giống "Khách hàng" (đang có nhóm riêng) — đã hỏi người dùng có muốn tách ra không, **chưa có câu trả lời**, giữ nguyên như cũ.

**6. Rà soát toàn hệ thống theo yêu cầu "check hết bug, check dữ liệu"**:
- Đối chiếu toàn bộ menu ↔ route ↔ breadcrumb map — khớp 100%, không mục nào dẫn tới trang chết, không route nào mồ côi ngoài menu.
- Chạy 24 kiểm tra trực tiếp trên DB (tồn kho âm, FK thiếu, trùng mã, đơn thiếu chi tiết, hóa đơn thiếu DO CLOSED, sản phẩm thiếu nhóm quy đổi, bảng giá thiếu dòng giá, trùng dòng giá, v.v.) — **tất cả sạch (0 lỗi)**, chỉ có 1 dòng "khác thường nhưng bình thường": SO0002 đã CONFIRMED nhưng chưa có Đơn giao hàng (chỉ là đơn demo cũ chưa ai xử lý tiếp, không phải lỗi).
- Lúc đầu tưởng phát hiện bảng giá `BG-DAILY-C1` thiếu giá 11/11 sản phẩm — kiểm lại thì đó là **lỗi trong chính câu SQL kiểm tra** (sai độ ưu tiên AND/OR), không phải lỗi dữ liệu thật; bảng giá đó thực tế đủ giá cho cả 11 sản phẩm. Đã tự phát hiện và đính chính lại với người dùng trước khi kết luận.

**7. Lưu ý vận hành phát hiện trong lúc restart backend để load code mới**: nếu mở PowerShell mới gõ thẳng `.\mvnw.cmd spring-boot:run` mà **không set** `$env:OLTP_DB_PORT='3308'` trước, Spring sẽ tự nối nhầm cổng mặc định 3306 (có thể trúng 1 MySQL khác trên máy) và báo lỗi gây hiểu nhầm "Access denied for user 'erp_user'@'localhost'" (nghe như sai mật khẩu nhưng thực ra là sai cổng/sai server). Luôn khởi động qua `scripts\dev-start.ps1` (lệnh "chạy web") để script tự set đúng biến này, hoặc set tay `$env:OLTP_DB_PORT='3308'` trước khi gọi `mvnw spring-boot:run -Dspring-boot.run.profiles=dev` nếu chạy thủ công. Background process của backend cũng tự bị dừng sau 30 phút nếu không chỉ định timeout dài hơn khi chạy nền.

## 🚀 Xác nhận Đơn hàng bán tự tạo Đơn giao hàng + Lọc dữ liệu theo Chi nhánh toàn hệ thống (2026-10-04 → 2026-10-07)

**1. Xác nhận Đơn hàng bán tự động tạo luôn Đơn giao hàng (DRAFT)**: trước đây sau khi duyệt đơn (SO), phải qua riêng trang Đơn giao hàng bấm "+" chọn lại đúng đơn mới tạo được lệnh giao. Giờ `SalesOrderService.confirm()` sau khi duyệt đơn gọi luôn `DeliveryOrderService.create()` trong cùng 1 transaction, copy nguyên số lượng/ĐVT từ đơn — Đơn giao hàng hiện sẵn ngay, trạng thái DRAFT (chưa trừ kho). Áp dụng đồng nhất cho cả nút Xác nhận đơn lẻ lẫn "Xác nhận hàng loạt" (cùng gọi chung API `/confirm`). Icon nút Xác nhận đổi từ dấu tick sang xe tải (TruckOutlined). Đã test qua API: tạo SO → xác nhận → Đơn giao hàng tự động xuất hiện (DRAFT, đúng kho/số lượng/ĐVT), tồn kho không đổi.

**2. Sự cố dữ liệu từ nhánh Nhi (`feature/data-ai`) — đã rollback, không phải lỗi hệ thống của mình**: Nhi push 1 bản dump data (`database-dump/erp_qlkho_oltp_data.sql`) lên git để đồng bộ. Lúc nhập thử vào DB local, phát hiện bảng `user` trong dump chỉ còn 2 tài khoản (id 1, 8) nhưng hàng nghìn dòng ở `sales_order`/`delivery_order`/`goods_receipt`/`stock_take` lại tham chiếu tới user id 2-7 (không tồn tại) → sập hàng loạt trang (lỗi 500 ở `GET /sales-orders` và nhiều API khác). Đã backup DB trước khi nhập (`mysqldump` đầy đủ) nên rollback lại được ngay, không mất dữ liệu gì. Cần báo Nhi export lại dump đầy đủ bảng `user`.

**3. Lọc dữ liệu theo Chi nhánh toàn hệ thống (V39 + nhiều trang)** — yêu cầu: "tạo branch mới tự sinh 3 kho" đã có sẵn từ trước (test lại xác nhận đúng), nhưng phát hiện ra **phần lớn hệ thống chưa thực sự lọc theo Chi nhánh đang chọn ở Header** ngoài Kho/Tồn kho. Đã mở rộng thêm:
   - **Migration `V39__customer_branch.sql`**: thêm cột `branch_id` bắt buộc (NOT NULL) vào bảng `customer` — 1 Khách hàng thuộc đúng 1 Chi nhánh. Backfill dữ liệu thật: khách có `province_id` trùng tỉnh của 1 Chi nhánh thì tự gán vào chi nhánh đó, còn lại (không có tỉnh hoặc không khớp) gán mặc định về `CN-BD`.
   - **Khách hàng**: thêm cột/field "Chi nhánh" (bắt buộc), lọc bảng danh sách + dropdown Khách hàng (trong SO/SR) theo Chi nhánh đang chọn ở Header.
   - **Khung tuyến (Route Master)**: lọc theo Chi nhánh (cột `branch_id` đã có sẵn từ trước, chỉ thêm filter).
   - **Dropdown Sản phẩm** trong SO/SR: tái sử dụng API có sẵn `GET /api/branches/{id}/products` (Item-Branch Assignment) để chỉ hiện sản phẩm đã được "Phân bổ theo chi nhánh" đó — **lưu ý quan trọng**: chi nhánh nào chưa phân bổ sản phẩm nào thì dropdown này sẽ trống, không tạo đơn được cho tới khi vào trang Sản phẩm gán sản phẩm cho chi nhánh đó.
   - **7 trang chứng từ** lọc theo Chi nhánh (client-side, không đổi API): Đơn hàng bán, Đơn giao hàng, Hóa đơn, Trả hàng bán, Phiếu nhập hàng, Phiếu xuất kho đều lọc theo `warehouse.branch.id`; riêng **Yêu cầu bán hàng (SR)** lọc theo `customer.branch.id` vì SR chưa gắn kho (chưa chốt lúc ghi tạm).
   - Mọi chỗ filter Select đều giữ lại rõ ràng option của bản ghi đang sửa (customer/product) dù khác chi nhánh đang chọn, theo đúng pattern đã rút ra từ các lần sửa warehouse trước đó — tránh lặp lại bug "mất label hiện ID số".

**Dữ liệu thật sau backfill**: 3 khách hàng demo cũ (WinMart/BHX/Co.opmart, không có tỉnh) → `CN-BD`; khách hàng "abc" (tỉnh id=1) → chi nhánh `HCM` (người dùng tự tạo tay lúc test tính năng auto-sinh-kho).

**Đã test qua API**: GET /customers trả về đúng field `branch`; POST thiếu `branchId` bị chặn đúng thông báo lỗi; migration V39 chạy sạch; `GET /branches/{id}/products` xác nhận đúng CN-BD có 11 SP, CN_HN có 4 SP, HCM có 0 SP (đúng cảnh báo đã nêu trước khi code). Build backend + frontend đều sạch.

## ✅ Rà soát toàn hệ thống sau đợt lọc theo Chi nhánh (2026-10-07)

Theo yêu cầu "kiểm lại toàn bộ xem có lỗi không" — chạy đủ 3 lớp kiểm tra, không chỉ dựa vào build sạch:

**1. 22 kiểm tra toàn vẹn dữ liệu trực tiếp trên DB** (tồn kho âm, Khách hàng thiếu/mồ côi `branch_id`, Kho thiếu chi nhánh/thiếu kho MAIN-VAN, Khung tuyến thiếu `branch_id`, Item-Branch Assignment mồ côi, trùng mã, trùng dòng giá, SO thiếu chi tiết, DO thiếu `van_warehouse_id`, Hóa đơn thiếu DO CLOSED, đối chiếu số dòng Đơn giao hàng tự động tạo khớp đúng số dòng Đơn hàng bán gốc...) — **21/22 sạch**. 1 dòng cảnh báo ("SO CONFIRMED nhưng chưa có DO") hóa ra là đơn "abca" do chính người dùng tự tạo+duyệt tay lúc 16:39 — **trước** thời điểm backend nạp xong code tính năng tự động tạo Đơn giao hàng (16:53), nên thuộc diện lịch sử bình thường, không phải lỗi, giống hệt trường hợp SO0002 trước đó.

**2. Quét trực tiếp 32 API chính** (Khách hàng, Chi nhánh, Kho, Sản phẩm, Bảng giá, Đơn hàng bán, Yêu cầu bán hàng, Đơn giao hàng, Hóa đơn, Trả hàng, Nhập/Xuất kho, Khung tuyến, Nhân viên, Tồn kho, Kiểm kê, Nhóm KH/SP, Danh mục...) — phát hiện 2 lỗi 500 ở `/units` và `/vendors`, nhưng kiểm lại thì đây là **lỗi trong chính danh sách endpoint tôi tự gõ** (API thật là `/uoms` và `/suppliers`, không phải `/units`/`/vendors`) — gọi đúng đường dẫn thì cả 2 đều trả về OK bình thường. **Không có lỗi 500 thật nào.**

**3. Build backend (Maven) + frontend (Vite)**: cả 2 đều sạch, không cảnh báo/lỗi.

**Kết luận: hệ thống hiện đang sạch**, không phát hiện lỗi thật nào sau toàn bộ các thay đổi của đợt "Xác nhận tự tạo Đơn giao hàng" + "Lọc theo Chi nhánh" hôm nay.

## 🔀 Gộp trang "Xác nhận giao hàng" vào trang "Đơn giao hàng" (2026-10-08)

Trước đây 2 trang riêng (mô phỏng đúng pattern DMS thật: người lập lệnh giao và người xác nhận xuất kho là 2 vai khác nhau) — theo yêu cầu người dùng, gộp lại thành 1 trang duy nhất cho gọn:

- Trang **"Đơn giao hàng"** giờ có thêm nút **Xác nhận giao hàng** (dấu tick) ngay trong cột Thao tác — chỉ hiện khi đơn còn "Chờ giao", tái sử dụng nguyên API `/delivery-orders/{id}/confirm` đã có sẵn (không đổi gì backend).
- Thêm nút xem lịch sử **"Người xác nhận giao hàng"** (icon người, mở Modal liệt kê toàn bộ đơn + ai đã xác nhận) vào thanh công cụ — chuyển nguyên từ trang cũ sang.
- **Xóa hẳn** trang/route/menu "Xác nhận giao hàng" (`/sales/delivery-confirm`) — menu Bán hàng còn 11 mục thay vì 12.

Build frontend sạch, compile-check qua dev server OK. Không có thay đổi backend/database nào trong đợt này.

## 🧭 4 cải tiến Khung tuyến + khóa Chi nhánh Khách hàng + dọn & dựng dữ liệu mẫu 2 khu vực (2026-10-08 → 2026-10-09)

**A. 4 cải tiến Khung tuyến (migration V40)**:
1. **Lọc Khách hàng theo Vùng bán hàng**: dropdown "Khách hàng" khi thêm vào tuyến chỉ hiện khách có địa chỉ khớp đúng Vùng bán hàng của tuyến (khớp đến cấp Vùng bán hàng ĐÃ khai báo — set tới Tỉnh thì khớp cả tỉnh, set thêm Huyện thì khớp đúng huyện). Dùng field FK `regionRef/provinceRef/districtRef/wardRef` của SellingZone so với `region/province/district/ward` của Customer.
2. **Lịch ghé thăm đổi từ "tuần 1-4 trong tháng" (4 cột boolean) sang "tuần cụ thể trong năm"** (cột mới `visit_weeks`, chuỗi số tuần 1-53 cách nhau dấu phẩy, tự reset mỗi năm vì không lưu năm). Sửa đồng bộ: `RouteMasterOutlet` entity/DTO, `CustomerRouteInfoDto`, công thức "Đúng tuyến/Trái tuyến" ở Đơn hàng bán (đổi sang tính ISO week number chuẩn thay vì `Math.ceil(ngày/7)`). Form đổi 4 checkbox thành 1 ô chọn nhiều (multi-select) tuần 1→53.
3. **Thêm nút Sửa lịch ghé thăm** cho khách hàng đã có trong tuyến (API `PUT /route-masters/{id}/outlets/{outletId}` mới) — đổi Thứ tự/Thứ/Tuần mà không cần gỡ rồi thêm lại, không cho đổi khách hàng lúc sửa.
4. **Sửa lỗi canh chỉnh nút "Thêm" ở tab Nhân sự bị lệch** — do dòng ghi chú dưới ô "Ngày kết thúc" làm ô đó cao hơn trong layout inline, đã chuyển ghi chú ra ngoài hàng.

**B. Khóa cứng "Chi nhánh" ở form Khách hàng** (giống Kho xuất/Chi nhánh quản lý Kho/Chi nhánh Khung tuyến trước đó) — không cho chọn tay sang chi nhánh khác, luôn đúng chi nhánh đang chọn ở Header (tạo mới) hoặc đúng chi nhánh hiện tại của khách (sửa).

**C. Dọn dữ liệu Vùng bán hàng + Chi nhánh rác, dựng lại 2 Vùng chuẩn**:
- Xóa Route rác "123" + Vùng bán hàng rác "ádas" (id=2).
- Sửa Vùng id=1 thành **"Vùng Miền Bắc"** (Chi nhánh Hà Nội, gán cấp Tỉnh = Hà Nội).
- Tạo mới **"Vùng Miền Nam"** (Chi nhánh Bình Dương, gán cấp Vùng = Miền Nam — bao TP.HCM + Bình Dương + Đồng Nai, vì 1 Vùng bán hàng chỉ gán được 1 cấp địa chỉ nên không tách riêng được 2 tỉnh).
- Chuyển **RT-001** ("Tuyến siêu thị Bình Dương") sang Vùng Miền Nam, giữ nguyên không xóa.
- Gán lại địa chỉ cho 2 khách hàng cũ **WinMart** (→ Bình Dương) và **Co.opmart** (→ TP.HCM, khớp đúng địa chỉ chữ cũ "Quận 3, TP.HCM") để khớp Vùng Miền Nam.
- **Xóa 3 chi nhánh rác** (HCM, MN-miennam, sada-ádsada, do người dùng tự tạo lúc test trước đó) cùng 9 kho tự sinh + 2 khách hàng test ("abc", "213") + 1 đơn hàng test ("abca", đơn CONFIRMED từ trước lúc tính năng tự tạo Đơn giao hàng chưa deploy).
- Sau dọn: hệ thống chỉ còn đúng 2 chi nhánh sạch (CN-BD, CN_HN).

**D. Dựng đầy đủ dữ liệu mẫu cho khu vực Hà Nội** (trước đó chỉ có Kho/Bảng giá/4 SP phân bổ/2 khách hàng, CHƯA có Khung tuyến):
- Tạo **Khung tuyến "RT-HN01"** (Tuyến nội thành Hà Nội), gán đúng Vùng Miền Bắc + Chi nhánh Hà Nội.
- Gán KH-HN01 (Thứ Hai, tuần 1-4) và KH-HN02 (Thứ Năm, tuần 1-4) vào tuyến.
- **Test trực tiếp toàn bộ chuỗi bán hàng thật tại Hà Nội**: SO0013 (KH-HN01, 2 Hộp CP001) → Xác nhận (tự tạo DO0008) → Xác nhận giao hàng (Kho Chính HN 10.000→9.976, Kho Van HN 0→24) → Xuất hóa đơn HD0004 (88.000đ gồm thuế, Kho Van về lại 0) — **chạy đúng 100%, 0 lỗi**.
- Tạo thêm **KH-HN03** (chưa gán tuyến nào) để minh họa dropdown "Khách hàng" trong tuyến load được khách mới (trước đó dropdown hiện "No data" vì cả 2 khách Hà Nội đã gán hết rồi — **không phải lỗi**, chỉ là hết khách khả dụng).
- Chạy lại 22 kiểm tra toàn vẹn dữ liệu cho toàn hệ thống sau tất cả thay đổi trên — **sạch 0 lỗi**.

**Lưu ý vận hành phát hiện lúc "chạy web" hôm 2026-10-08/09**: Docker Desktop đôi lúc khởi động rất chậm hoặc tự crash-rồi-tự-phục-hồi (quan sát thấy `com.docker.backend` chết rồi `wslrelay` tự khởi động lại sau ~3-6 phút) — không phải mất dữ liệu (container/volume vẫn giữ nguyên, đã xác minh dữ liệu còn đủ sau khi Docker lên lại). Nếu `docker ps` báo lỗi "failed to connect to the docker API", cứ đợi thêm (tới ~5-6 phút) thay vì nghi ngờ mất dữ liệu ngay — PowerShell script `dev-start.ps1` tự có bug nhỏ (lỗi `NativeCommandError` làm thoát sớm khi Docker còn đang khởi động) nên nhiều lúc phải tự chạy tay `docker compose up -d` + `mvnw spring-boot:run` + `npm run dev` thay vì chạy thẳng script.

## 💰 Chuyển hiệu lực giá từ Bảng giá xuống từng dòng giá sản phẩm (2026-10-09)

**Vấn đề phát hiện**: `PriceList` (bảng giá) có 2 trường "Ngày hiệu lực"/"Ngày hết hiệu lực" nhưng kiểm tra code thì `PriceListService.lookupPrice` **chưa bao giờ đọc 2 trường này** — chỉ mang tính trang trí, không có tác dụng lọc giá thật. Yêu cầu: hiệu lực phải nằm ở **từng dòng giá sản phẩm** (PriceListItem, tức SP + ĐVT) để 1 sản phẩm có thể có nhiều mức giá theo từng giai đoạn khác nhau (lịch sử giá), và `lookupPrice` phải thực sự lọc theo ngày chứng từ.

**Đã làm (V41)**:
- Thêm `start_date` (NOT NULL, backfill từ `price_list.start_date` hoặc `2026-01-01` nếu trống) + `end_date` vào `price_list_item`; bỏ ràng buộc UNIQUE (price_list_id, product_id, uom_id) — giờ 1 SP+ĐVT được phép có nhiều dòng giá miễn không chồng lặp hiệu lực. Bỏ 2 cột start_date/end_date khỏi `price_list`.
- *Lưu ý kỹ thuật*: migration suýt lỗi vì MySQL không cho xóa index đang làm chỗ dựa cho khóa ngoại (`FK price_list_id`) — phải tạo index thay thế trước khi xóa UNIQUE cũ.
- `addItem()`: chặn thêm dòng giá nếu khoảng hiệu lực chồng lặp với dòng giá khác cùng SP+ĐVT (tái dùng đúng pattern `validateNoOverlap` của Khung tuyến).
- `lookupPrice()`/`pickPrice()`: thêm tham số `date`, lọc dòng giá theo hiệu lực tại ngày đó trước khi chọn ĐVT — không tìm được dòng hợp lệ thì báo lỗi rõ ràng (không có giá fallback).
- 3 nơi gọi tra giá (Đơn hàng bán, Yêu cầu bán hàng, Phiếu nhập hàng) đều truyền thêm `date` = ngày chứng từ đang lập (docDate).
- Trang Bảng giá: bỏ 2 trường Ngày hiệu lực/hết hiệu lực ở form Bảng giá (header), thêm 2 trường đó vào form "Thêm giá sản phẩm" (dòng giá).

**Đã test qua API (sạch, dữ liệu demo cũ không bị ảnh hưởng)**: tạo 2 dòng giá nối tiếp cho 1 SP+ĐVT mới (100.000đ hiệu lực 01/01→30/06, 120.000đ từ 01/07 không giới hạn) → thêm dòng thứ 3 chồng lặp (01/03) bị từ chối đúng như kỳ vọng → tra giá ngày 02/2026 ra 100.000, ngày 08/2026 ra 120.000, ngày trước 01/01/2026 báo lỗi "không tìm thấy giá hợp lệ" → dòng giá cũ có sẵn (backfill start_date=2026-01-01, end_date=NULL) vẫn tra đúng giá cũ bình thường. Sau test đã xóa sạch 2 dòng giá test, bảng giá BG-DAILY-C1 về lại đúng 11 dòng ban đầu.

## ✏️ Thêm nút Sửa dòng giá sản phẩm (2026-10-09)

Trang Bảng giá, mục "Giá sản phẩm": thêm nút Sửa (bên cạnh nút Xóa cũ) cho mỗi dòng giá — sửa Giá/Ngày hiệu lực/Ngày hết hiệu lực, **không đổi được** Sản phẩm/ĐVT (đổi 2 trường đó coi như là dòng khác, phải xóa/thêm lại). Lý do cần: sản phẩm đã phân bổ chi nhánh thì không xóa được dòng giá (chỉ sửa) — trước đây chưa có cách sửa nên bị kẹt.
- Backend: `PriceListService.updateItem()` + `PUT /api/price-lists/{id}/items/{itemId}` — validate chồng lặp hiệu lực giống `addItem()`, trừ chính dòng đang sửa ra khỏi danh sách so sánh.
- Đã test qua API: sửa giá trong đúng khoảng hiệu lực cũ → thành công, tra giá xác nhận đổi đúng; sửa ngày để chồng lặp dòng khác → bị chặn; ngày hết hiệu lực trước ngày hiệu lực → bị chặn.

## 🚐 Loại đơn: Pre-order lên đầu + khóa Van-Sales; Kho xuất tự suy từ Khách hàng (2026-10-09)

**Loại đơn** (Đơn hàng bán): đổi thứ tự dropdown — Pre-order lên đầu (loại chính dùng trên web). **Van-Sales** (STANDARD, đặt-giao ngay) bị **disable** trên web, không tạo mới được nữa — loại này sẽ làm qua **App Van-Sales riêng** (mobile, CHƯA làm, xem mục "Việc đang treo" dưới nếu cần theo dõi tiếp). Đơn Van-Sales cũ vẫn xem/sửa bình thường, chỉ không chọn lại được khi tạo mới. Backend KHÔNG đổi — vẫn nhận `orderType=STANDARD` qua API như cũ (để dành cho App Van-Sales gọi tới sau này qua cùng API). Mặc định khi tạo đơn mới đổi từ STANDARD sang PRE_ORDER.

**Kho xuất**: bỏ hẳn việc chọn tay — tự suy từ Khách hàng: khách thuộc chi nhánh nào thì tự gán Kho **Main** của đúng chi nhánh đó (field hiện ở dạng khóa, chỉ hiện để biết đơn xuất từ kho nào). Đổi thứ tự field: Khách hàng lên trước Kho xuất. Chỉ áp dụng khi người dùng tự đổi Khách hàng (onChange) — mở lại đơn cũ để sửa vẫn giữ đúng kho đã lưu của đơn đó, không bị ghi đè. Khách hàng thuộc chi nhánh chưa có kho Main → báo lỗi, chặn lưu. Bỏ luôn đoạn code cũ "xóa kho đã chọn khi đổi sang Pre-order nếu không phải Main" (dư, vì giờ luôn là Main).

Đã test qua API: tạo đơn Pre-order cho khách Hà Nội (chi nhánh CN_HN) → đơn tự nhận đúng kho `KHO-CHINH-HN` (Main của CN_HN) như kỳ vọng. Lưu ý: backend hiện KHÔNG tự validate warehouse phải cùng chi nhánh với khách hàng (chỉ web khóa field) — nếu có ai gọi API trực tiếp với warehouseId sai chi nhánh thì vẫn tạo được, đây là rủi ro nhỏ đã biết, chưa xử lý ở backend.

Xác nhận lại 2 phần không cần sửa (đã đúng sẵn từ trước): dropdown Khách hàng ở "+Thêm đơn hàng bán" đã lọc đúng theo Chi nhánh đang chọn ở Header; tính "Đúng tuyến/Sai tuyến" theo tuần đã kiểm tra đúng cả ngày trong tuần + tuần ISO trong năm.

## 🧹 Xóa 5 trang Placeholder + Thêm "NVBH + Tuyến" vào Đơn hàng bán + Phiếu nhập kho mới (2026-10-09)

**A. Xóa 5 trang Placeholder rỗng khỏi Sidebar** (dọn tiếp các mục chỉ dựng khung chưa có logic thật, xem mục "Chưa làm / ngoài phạm vi"): Phiếu ghi có, Phiếu soạn hàng/In phiếu giao hàng, Kết quả giao hàng, Khai thuế TNCN hoa hồng (nhóm Bán hàng), Nhật ký tự động đặt hàng/Thiết lập chỉ tiêu SP (nhóm Mua hàng). Xóa luôn 3 file trang không còn dùng.

**B. "NVBH" + "Tuyến" trên Đơn hàng bán** — lưu lại Tuyến + NVBH đang phụ trách tuyến của khách hàng **tại đúng Ngày đặt hàng** (phục vụ báo cáo doanh số/hoa hồng sau này). Tự suy hoàn toàn, khóa cứng không cho chọn tay:
- V42: thêm `sales_order.route_master_id` + `salesman_id` (FK `employee`), cho phép NULL (khách hàng chưa gán tuyến, hoặc tuyến đang trống NVBH tại thời điểm đó thì không chặn tạo đơn).
- `GET /customers/{id}/route-info` thêm tham số `date` → trả thêm Tuyến + NVBH đang hiệu lực tại ngày đó (NVBH tra theo timeline `RouteSalesmanAssignment`, khác Tuyến là cố định theo khách hàng).
- Frontend: gọi lại API này cả khi đổi Khách hàng **và** khi đổi Ngày đặt hàng (vì NVBH phụ thuộc ngày). Mở lại đơn cũ để sửa thì giữ đúng Tuyến/NVBH đã lưu của đơn đó, không tự tính lại.
- Đã test qua API: thêm phân bổ NVBH cho tuyến RT-HN01 → route-info tra đúng; tạo đơn lưu đúng quan hệ; đổi ngày về trước khi NVBH có hiệu lực → NVBH trả null nhưng Tuyến giữ nguyên (đúng thiết kế, vì Tuyến cố định còn NVBH theo thời gian).

**C. "Phiếu nhập kho" mới (độc lập, KHÔNG qua Nhà cung cấp)** — đối xứng với "Phiếu xuất kho" đã có, dùng cho nhập kho không qua mua hàng (điều chỉnh tăng sau kiểm kê, phát hiện thừa, nhập nội bộ). Khác "Nhập hàng" (GoodsReceipt) hiện tại ở chỗ **có ĐVT** (Gói/Hộp/Thùng, quy đổi qua `UomConversionService`) + Đơn giá trên từng dòng — nhiều hơn "Nhập hàng" cũ (bên đó chưa có ĐVT).
- V43: bảng `stock_receipt` + `stock_receipt_item`, mã phiếu tự sinh prefix `NK` (vì `PN` đã dùng cho Nhập hàng).
- Trang mới trong menu Tồn kho, cạnh Phiếu xuất kho — Xác nhận sẽ cộng tồn kho, không sửa/xóa được khi đã đóng (CLOSED).
- Đã test qua API: tạo phiếu 2 Thùng CP001 → quy đổi đúng 288 Gói (hệ số 12×12×2) → DRAFT chưa đổi tồn → Xác nhận cộng đúng +288 vào tồn thực tế → sửa/xóa phiếu CLOSED bị chặn đúng.

## 🔎 Thêm ô tìm kiếm trong Bảng giá + Khóa Kho xuất trả = Kho hư cho Trả hàng NCC (2026-10-09)

**A. Bảng giá**: thêm tìm kiếm (showSearch) cho ô "Đơn vị" ở form "+Thêm giá sản phẩm" (ô "Chọn sản phẩm" đã có sẵn từ trước). Thêm 1 ô tìm riêng phía trên danh sách dòng giá trong Modal "Giá sản phẩm" để lọc theo mã/tên sản phẩm (lọc ở Frontend, không gọi lại API).

**B. Trả hàng NCC**: "Kho xuất trả" không còn cho chọn tay - tự động là **Kho hư (DAMAGE)** của chi nhánh đang chọn ở Header (hàng trả NCC thường là hàng lỗi/hư, không phải hàng tốt ở Main/Van). Không tìm được Kho hư thì báo lỗi, chặn tạo phiếu. Phát hiện thêm lỗ hổng khi đọc code: danh sách Trả hàng NCC trước đó **chưa lọc theo chi nhánh** (khác mọi trang chứng từ khác) - đã sửa cho đồng bộ.

**Dữ liệu phát hiện thiếu**: cả 2 chi nhánh hiện có (CN-BD, CN_HN) đều **chưa có Kho hư (DAMAGE)** - có lẽ được tạo trước khi logic tự sinh 3 kho/chi nhánh có Damage. Đã tạo bù qua API đúng mẫu mã `{mã CN}DWH01` (CN-BDDWH01, CN_HNDWH01) giống Chi nhánh mới tự sinh.

Đã test qua API: tạo phiếu trả hàng → tự nhận đúng Kho hư vừa tạo; xác nhận bị chặn đúng vì kho hư mới tạo chưa có tồn (guard có sẵn, không cần sửa thêm).

## 📦 Dữ liệu mua hàng cho Hà Nội + Test chuỗi Điều chuyển kho → Trả hàng NCC qua Kho hư (2026-10-10)

**A. Bổ sung dữ liệu mua hàng cho khu vực Hà Nội** (trước đó khu vực này có đủ bên Bán hàng nhưng thiếu hẳn bên Mua hàng): tạo Nhà cung cấp mới **NCC-HANOI** ("Công ty TNHH Phân phối Thực phẩm Miền Bắc"), 2 phiếu Nhập hàng vào Kho Chính Hà Nội: **PN0006** (đã xác nhận, 50 Gói CP001 + 30 Gói CP002) và **PN0007** (còn nháp, để test trạng thái "Nháp"). Đã test tồn kho cộng đúng: CP001 9976→10026, CP002 10000→10030, phiếu nháp không ảnh hưởng tồn. (Lưu ý: Nhà cung cấp là dữ liệu dùng chung toàn hệ thống, không ràng buộc theo chi nhánh trong thiết kế DB - chỉ đặt tên gợi ý vùng miền cho dễ hiểu.)

**B. Test đầy đủ chuỗi "Kho xuất trả = Kho hư" cho Trả hàng NCC** (tính năng đã làm trước đó, lần này test thật với dữ liệu thật chứ không chỉ test API suông): vì Kho hư 2 chi nhánh ban đầu trống (0 tồn) nên phải tạo chuỗi dữ liệu thật để xác nhận Duyệt phiếu thành công: Điều chuyển kho 10 Gói CP001 từ Kho Main → Kho hư (CN-BDDWH01, phiếu **DC0002**) → Trả hàng NCC 5 Gói từ đúng Kho hư đó (phiếu **PRT0004**, tự động khóa đúng kho, Duyệt thành công). Số liệu khớp đúng từng bước: Main 9976→9966, Kho hư 0→10→5. **Giữ lại chuỗi này làm dữ liệu demo minh họa, không xóa.**

## 🧰 Hoàn thiện Đơn giao hàng + dựng đơn hàng demo trải 10/10 → 30/10/2026 (2026-10-10)

**A. Trang Đơn giao hàng — làm giống hệt layout Đơn hàng bán**: bảng "Số lượng giao" thêm Đơn giá/Thành tiền/Thuế (ước tính) + dòng tổng kết đầy đủ (Tổng số lượng/Tiền hàng/Thuế ước tính/Tổng cộng ước tính) — chỉ hiển thị tham khảo (lấy từ Đơn hàng bán gốc), không lưu thêm cột DB. Form "+Tạo đơn giao hàng" thêm các trường tham khảo Loại đơn/Ngày đặt hàng/Ngày giao hàng/Khách hàng/Tuyến/NV bán hàng (đều khóa, lấy từ đơn gốc) — đã phân tích và quyết định **không** cho sửa các trường này vì chúng gắn chặt 1-1 với đúng 1 Đơn hàng bán, sửa ở đây sẽ gây lệch dữ liệu. Modal mở rộng 720→1000, xếp 3 cột/hàng cho đỡ cuộn.

**B. Hoàn thiện lịch ghé thăm + NVBH còn thiếu, dựng đơn demo trải dài 10/10-30/10/2026**: phát hiện WinMart/Co.opmart (RT-001) chưa từng có lịch ghé thăm (toàn bộ thứ + tuần đều trống) và tuyến RT-HN01 chưa có NVBH - bổ sung: WinMart → Thứ Ba, Co.opmart → Thứ Năm (tuần ISO 40-43, tháng 10/2026); KH-HN01/KH-HN02 mở rộng thêm tuần 40-43 (giữ nguyên tuần 1-4 cũ); gán NVBH "Nguyễn Văn Test" cho RT-HN01. Tạo 6 đơn hàng bán demo (SO0021-SO0026) trải từ 10/10 đến 30/10/2026, cố ý mix cả "Đúng tuyến" và "Trái tuyến", cả 2 chi nhánh - đã verify bằng cách tính lại y hệt công thức `computeVisitType` ở Frontend, khớp đúng 100% cả 6 đơn. Xác nhận Kho xuất/Tuyến/NVBH tự suy đúng cho tất cả.

## 🔍 Rà soát toàn hệ thống: lọc theo Chi nhánh còn thiếu ở 5 chỗ (2026-10-10)

Người dùng phát hiện bug trực tiếp trên web: đang xem Chi nhánh Hà Nội nhưng dropdown "Đơn hàng bán" ở "+Tạo đơn giao hàng" vẫn hiện đơn của Bình Dương (SO0002). Từ đó rà soát lại **toàn bộ** các trang có dùng `useBranch` (14 trang) + 2 trang Điều chuyển kho (vốn không dùng `useBranch`), tìm thấy tổng cộng **5 chỗ** thiếu lọc đúng Chi nhánh:

1. **Đơn giao hàng** - dropdown "Đơn hàng bán" trong "+Tạo đơn giao hàng" (đã sửa, xem mục trước).
2. **Trả hàng NCC** - dropdown "Phiếu nhập gốc" (`goodsReceiptOptions`) chưa lọc Chi nhánh.
3. **Kiểm kê kho** - danh sách chính (`filteredCounts`) chưa lọc Chi nhánh (riêng ô chọn Kho thì đã lọc sẵn từ trước, chỉ sót bảng danh sách).
4. **Chuyển hàng tồn kho** (bước 1, kho nguồn xác nhận xuất) - trang này **chưa từng dùng `useBranch`** - danh sách phiếu hiện hết, không lọc gì. Quyết định thiết kế: "Kho đi"/"Kho đến" vẫn giữ KHÔNG lọc (đúng bản chất là chuyển *giữa* 2 chi nhánh, cần thấy hết để chọn), nhưng **danh sách phiếu** thì lọc theo đúng **Kho đi** thuộc chi nhánh đang xem (vì đây là màn hình của kho nguồn).
5. **Xác nhận di chuyển hàng tồn kho** (bước 2, kho đích xác nhận nhận) - tương tự, lọc danh sách theo **Kho đến** (màn hình của kho đích).

Đã build sạch, kiểm tra lại dữ liệu qua API xác nhận đủ trường `warehouse.branch`/`fromWarehouse.branch`/`toWarehouse.branch` để bộ lọc hoạt động đúng. Các trang còn lại đã rà soát đều lọc đúng từ trước (Đơn hàng bán, Yêu cầu bán hàng, Trả hàng, Hóa đơn, Nhập hàng, Phiếu xuất/nhập kho, Khách hàng, Kho, Khung tuyến).

## ↩️ Hóa đơn: nút "Trả hàng" tạo nhanh Phiếu trả hàng (2026-10-10)

Thêm nút **Trả hàng** (icon, đầu tiên trong cột Thao tác) ở trang Hóa đơn. Bấm vào → popup nhập Lý do trả hàng → OK → tạo 1 Phiếu trả hàng (Nháp) copy nguyên dòng sản phẩm từ hóa đơn, **Kho luôn là Kho Main** của chi nhánh (không phải kho Van), NVBH lấy từ NVBH của Đơn hàng bán gốc. Không tự Duyệt — vẫn phải qua trang "Trả hàng" để Duyệt (cộng thật vào tồn kho), giữ đúng quy trình Nháp→Đã duyệt sẵn có. Tái dùng nguyên API `POST /sales-returns`, không sửa backend.

**Giới hạn đã biết**: nếu đơn hàng gốc của hóa đơn chưa có NVBH (đơn cũ, tạo trước V42) thì nút này báo lỗi và chặn — phải dùng "+Thêm phiếu trả hàng" thủ công thay thế (NVBH là trường bắt buộc ở Phiếu trả hàng).

Đã test qua API (mô phỏng đúng payload nút sẽ gửi): đẩy SO0022 qua hết chuỗi Xác nhận giao hàng → Xuất hóa đơn (HD0006) → tạo Phiếu trả hàng → Duyệt → tồn kho Main tăng đúng 24 Gói (2 Hộp × hệ số 12). Đã xóa phiếu trả hàng test, **giữ lại chuỗi SO0022→DO0011→HD0006** làm ví dụ demo hoàn chỉnh thêm. Đã xác nhận chặn đúng khi đơn gốc chưa có NVBH (HD0001).

## 🚫 Thêm nút "Hủy" cho Trả hàng / Đơn giao hàng / Hóa đơn + liên kết Hóa đơn gốc ở Trả hàng (2026-10-10)

**1. Trả hàng**: nút "Xóa" đổi thành **"Hủy"** (soft-cancel, giữ lại bản ghi) — dùng được cả khi còn Nháp và khi đã Duyệt (CLOSED): nếu đã Duyệt thì trừ lại đúng số đã cộng vào Kho chính trước khi chuyển CANCELLED; nếu còn Nháp thì không đụng gì đến kho. Nút ✓ Duyệt (ngoài danh sách) và nút Lưu (trong modal sửa) giữ nguyên như cũ, không đổi. Thêm trường **"Hóa đơn gốc"** (tùy chọn) khi tạo/sửa phiếu trả hàng — chọn 1 hóa đơn sẽ tự gợi ý Kho/NVBH/sản phẩm theo hóa đơn đó (không khóa cứng, vẫn sửa được).

**2. Đơn giao hàng**: thêm nút **"Hủy"** — mở lại Đơn hàng bán gốc về "Chờ xác nhận" (PENDING); nếu đơn giao đã Xác nhận (CLOSED, đã chuyển kho Main→Van) thì hoàn kho Van→Main trước khi chuyển CANCELLED. **Bị chặn** nếu đơn hàng đó đã có Hóa đơn còn hiệu lực (chưa bị Hủy) — phải Hủy Hóa đơn trước.

**3. Hóa đơn**: trước đây hoàn toàn không có trạng thái (không sửa/xóa được). Thêm cột `status` (migration **V44**, mặc định `ACTIVE`) + nút **"Hủy"** — hoàn lại kho Van (đúng số đã trừ lúc xuất hóa đơn), mở lại Đơn giao hàng về "Chờ giao" (DRAFT, gỡ `confirmedBy`/`vanWarehouse`). **Bị chặn** nếu khách đã tạo phiếu Trả hàng còn hiệu lực dựa trên hóa đơn này — phải Hủy phiếu Trả hàng trước. Hóa đơn cũng tự hiện tag **"Trả hàng"** (tím, chỉ tính ở frontend, không phải trạng thái lưu DB) khi có phiếu Trả hàng đã Duyệt (CLOSED) còn hiệu lực gắn với đúng đơn hàng gốc của hóa đơn đó — hủy phiếu trả thì tự quay lại "Đã duyệt".

**Lỗi phát hiện khi test trực tiếp (đã sửa ngay, migration V45)**: cột `invoice.sales_order_id` có khóa **UNIQUE** thật trong DB — nên sau khi Hủy 1 hóa đơn, không bao giờ xuất được hóa đơn **mới** cho đúng đơn hàng đó nữa (dù Đơn giao hàng đã mở lại để giao lại được), mâu thuẫn với đúng mục đích của tính năng Hủy. V45: bỏ UNIQUE đó (vẫn giữ index thường để FK hoạt động), đổi điều kiện kiểm tra "đơn hàng đã xuất hóa đơn chưa" từ `existsBySalesOrderId` sang `existsBySalesOrderIdAndStatusNot(id, "CANCELLED")` (bỏ qua các hóa đơn đã Hủy). Entity `Invoice.salesOrder` đổi từ `@OneToOne` sang `@ManyToOne` (1 đơn hàng giờ có thể có nhiều hóa đơn theo thời gian, nhưng chỉ tối đa 1 đang ACTIVE cùng lúc).

**Đã test trực tiếp đầy đủ (API thật, sau khi restart backend áp dụng V44+V45)**:
- Hủy hóa đơn HD0006 (chuỗi demo SO0022→DO0011) → kho Van hoàn đúng +24, Đơn giao hàng DO0011 mở lại về DRAFT.
- Tạo/Duyệt/Hủy 1 phiếu Trả hàng test (RT0005) → kho Main cộng đúng +12 khi Duyệt, trừ đúng lại −12 khi Hủy (về đúng số gốc) — đã xóa phiếu test sau khi xác nhận.
- Hủy Đơn giao hàng: thử Hủy DO0012 (có Hóa đơn HD0008 còn hiệu lực) → bị chặn đúng (409, không đụng gì đến dữ liệu); thử Hủy DO0011 thật (không còn hóa đơn chặn) → kho Main +24 / Van −24 đúng, Đơn hàng bán mở lại PENDING — sau đó khôi phục lại đúng trạng thái gốc (CLOSED/CONFIRMED) bằng tay vì API không có đường "un-cancel" cho Đơn giao hàng.
- Sau khi sửa V45: xuất hóa đơn **mới** (HD0010) cho đúng SO0022 vừa bị hủy hóa đơn trước đó → thành công, kho Van trừ đúng −24. **Giữ lại chuỗi SO0022→DO0011→HD0010 làm demo cho tính năng Hủy** (HD0006 cũ vẫn còn trong lịch sử ở trạng thái CANCELLED).

## 🔁 Lỗi song song y hệt V45 nhưng ở Đơn giao hàng, phát hiện khi tự tạo dữ liệu test chạy full chiều đi/về (V46, 2026-10-10)

Sau khi sửa V45 (Hóa đơn), người dùng yêu cầu tự tạo dữ liệu mới và tự test đủ **chiều đi** (SO→DO→Hóa đơn→Trả hàng) và **chiều về** (Hủy Trả hàng→Hủy Hóa đơn→Hủy Đơn giao hàng) để chắc toàn luồng chạy đúng cả 2 chiều. Tạo mới hẳn 1 đơn demo (SO0027, CP001 x3 Hộp) đi hết chuỗi — mọi bước số liệu kho đều khớp đúng (Main/Van cộng/trừ đúng từng bước, kể cả tag "Trả hàng" tự hiện/tự tắt ở Hóa đơn).

Khi test tiếp "làm lại từ đầu sau khi đã hủy" (xác nhận lại Đơn hàng bán để tạo Đơn giao hàng mới) thì lộ ra lỗi **giống hệt lỗi V45 nhưng ở `delivery_order`**: `SalesOrderService.confirm()` tự động gọi tạo Đơn giao hàng ngay khi duyệt đơn — nhưng `DeliveryOrderService.create()` kiểm tra "đơn đã có Đơn giao hàng chưa" bằng `existsBySalesOrderId` (không loại trừ bản ghi đã **Hủy**) + cột `delivery_order.sales_order_id` cũng có UNIQUE thật trong DB — nên sau khi Hủy 1 Đơn giao hàng, **không bao giờ xác nhận lại được Đơn hàng bán đó nữa** (bị chặn ngay từ bước đầu tiên, còn nặng hơn lỗi Hóa đơn vì chặn sớm hơn).

**V46**: áp đúng pattern đã dùng ở V45 — bỏ UNIQUE trên `delivery_order.sales_order_id` (giữ index thường cho FK), đổi `existsBySalesOrderId` → `existsBySalesOrderIdAndStatusNot(id, "CANCELLED")`, `DeliveryOrder.salesOrder` đổi `@OneToOne` → `@ManyToOne`. Hai chỗ `InvoiceService` tra `DeliveryOrder` theo `salesOrderId` cũng phải đổi sang bản `...AndStatusNot` tương ứng, nếu không sẽ lỗi "non-unique result" khi 1 đơn hàng có nhiều dòng Đơn giao hàng (1 đã Hủy + 1 đang hoạt động).

**Đã test lại đầy đủ cả 2 chiều trên chính SO0027** (sau khi sửa V46): Hủy Trả hàng → Hủy Hóa đơn → Hủy Đơn giao hàng (mở lại SO0027 về "Chờ xác nhận") → xác nhận lại SO0027 → **tự tạo đúng 1 Đơn giao hàng MỚI** (DO0018, còn DO0017 cũ vẫn giữ nguyên trạng thái Đã hủy trong lịch sử) → xác nhận giao → xuất hóa đơn mới (HD0012) — số liệu kho khớp đúng từng bước suốt cả 2 chiều. Đã xóa sạch toàn bộ dữ liệu test (SO0027, DO0017/DO0018, HD0011/HD0012, RT0006 + các dòng sổ kho liên quan), kho đã về đúng số gốc trước khi test (Main 9894, Van 10004).

**Tiện phát hiện thêm lỗi nhỏ không liên quan**: trang Trả hàng thiếu import icon `DeleteOutlined` (dùng trong bảng chi tiết dòng hàng ở modal Sửa) — gây crash khi bấm nút Sửa. Đã rà soát lại toàn bộ 61 file frontend, xác nhận đây là lỗi duy nhất loại này trong toàn hệ thống.

## 🐛 Lỗi thật: Xác nhận lại Đơn giao hàng sau khi Hủy Hóa đơn làm kho bị trừ/cộng trùng 2 lần + thêm nút Xem (2026-10-10)

Người dùng tự test trên UI (chi nhánh Bình Dương, đơn SO0026): Xuất hóa đơn → Hủy hóa đơn (Đơn giao hàng về "Chờ giao") → Xác nhận lại Đơn giao hàng đó để hiện lại nút "Xuất hóa đơn" — hỏi "nếu làm vậy nó có bị lỗi +/- kho không chính xác không". Kiểm tra kỹ phát hiện **đúng là có lỗi thật**: `InvoiceService.cancel()` xóa luôn `vanWarehouse` của Đơn giao hàng khi mở lại DRAFT, nên `DeliveryOrderService.confirm()` (vốn luôn chuyển kho Main→Van mỗi khi DRAFT→CLOSED, không phân biệt lần đầu hay xác nhận lại) chạy **lại từ đầu** dù hàng chưa từng thật sự quay về Main — tồn kho Main bị trừ dư, Van bị cộng dư đúng 1 lần (xác minh qua số liệu thật: Main dư −24, Van dư +24 trên đơn SO0026/DO0021/HD0013).

**Sửa**: `InvoiceService.cancel()` không còn xóa `vanWarehouse` (hàng vẫn đang thật sự nằm ở Van, chỉ là chưa xuất hóa đơn) → `DeliveryOrderService.confirm()` đổi điều kiện: chỉ chuyển kho thật khi `vanWarehouse` đang **null** (lần xác nhận đầu tiên); nếu đã có sẵn thì chỉ đổi trạng thái về CLOSED, không chuyển kho lần 2. `DeliveryOrderService.cancel()` cũng đổi điều kiện hoàn kho từ `status==CLOSED` sang `vanWarehouse != null` (tín hiệu đúng hơn, phòng trường hợp Hủy ngay lúc DO đang DRAFT nhưng vanWarehouse vẫn còn do vừa Hủy Hóa đơn trước đó).

Đã chỉnh lại đúng số liệu kho Bình Dương bị lệch do lỗi này trước khi sửa (Main 9846→9870, Van 10052→10028) và test lại đúng kịch bản gây lỗi (Xuất hóa đơn → Hủy → Xác nhận lại → kho giữ nguyên không đổi → Xuất hóa đơn lại lần nữa → OK).

**Tiện thể thêm nút Xem (👁️, chỉ đọc, dùng được mọi trạng thái)** ở trang Trả hàng và Đơn giao hàng — trước đây nút Sửa bị khóa khi không còn Nháp/Chờ giao nên không có cách nào xem lại nội dung chứng từ đã Duyệt/Đã hủy.

## 🐛 Nút "Xuất hóa đơn" bị ẩn vĩnh viễn sau khi Hủy hóa đơn cũ (2026-10-10)

Sau khi sửa lỗi chuyển kho trùng (mục trên), người dùng tiếp tục tự test trên UI: đi hết 1 vòng Xuất hóa đơn → Hủy → Xác nhận lại Đơn giao hàng cho SO0026, rồi hỏi "nút xuất hóa đơn đâu" — vào đúng trang Đơn hàng bán nhưng **không thấy nút** dù đơn đã đủ điều kiện (đã giao xong, không còn hóa đơn hiệu lực). Kiểm tra lộ ra lỗi thật ở **3 chỗ cùng 1 gốc**: biến `invoicedOrderIds`/điều kiện `not exists (Invoice...)` được xây dựng từ **toàn bộ hóa đơn kể cả đã Hủy**, nên hễ 1 đơn hàng từng có hóa đơn bị Hủy thì bị coi là "đã có hóa đơn" **vĩnh viễn**, không bao giờ cho xuất lại được nữa (dù V45/V46 đã cho phép ở tầng backend) — lỗi mới phát sinh từ chính tính năng Hủy hóa đơn, các trang sau chưa được cập nhật theo:

1. `SalesOrder/index.jsx` — nút "Xuất hóa đơn" không hiện lại được.
2. `Inventories/index.jsx` (trang Tồn kho, cột "Đã đặt hàng") — đơn có hóa đơn đã Hủy bị loại oan khỏi tính "đang giữ chỗ", có thể làm tròn sai "Sẵn sàng bán" cao hơn thực tế.
3. `SalesOrderRepository.sumCommittedBase` (**backend**, dùng để CHẶN đặt vượt tồn khi tạo/duyệt đơn) — lỗi nặng nhất vì ảnh hưởng thẳng vào validation, không chỉ hiển thị.

**Sửa cả 3 chỗ**: đổi điều kiện từ "có hóa đơn nào đó" sang "có hóa đơn **còn hiệu lực** (status != CANCELLED)". Đã test lại: SO0026 sau khi Hủy hóa đơn và xác nhận lại Đơn giao hàng, nút Xuất hóa đơn hiện lại đúng.

## ⏳ Việc đang treo, CHƯA làm (nhớ làm sau khi xong hết việc hiện tại)

**Phân trang (pagination) cho các trang danh sách** — nguyên nhân: Nhi (thành viên 2, làm ETL/DW/AI/BI nhánh `feature/data-ai`) đẩy lên 1 bộ dữ liệu khá lớn, làm các trang danh sách (Đơn hàng bán...) load chậm hẳn mỗi lần bấm, vì hiện tại mọi trang đều gọi API tải **toàn bộ** bảng 1 lần (không giới hạn số dòng, JSON lồng sâu), lọc/tìm kiếm làm phía trình duyệt. Đã phân tích trong phiên và người dùng **xác nhận hoãn lại**, đợi làm xong hết các yêu cầu hiện tại mới quay lại làm. Hướng giải quyết đã thống nhất: phân trang phía Server (Spring Data `Pageable` + AntD `Table` pagination gọi lại API theo trang), làm thí điểm ở trang Đơn hàng bán trước — nhớ vẫn cần hỏi xác nhận lại trước khi code theo đúng quy tắc chung.

**App Van-Sales (mobile, riêng)** — Loại đơn "Van-Sales" (đặt-giao ngay, STANDARD) đã bị disable trên web (xem mục "Loại đơn: Pre-order lên đầu..." ở trên) vì nghiệp vụ này sẽ chuyển qua 1 App di động riêng cho NVBH/van-sales, hiện **chưa làm gì cả** (không nằm trong phạm vi web hiện tại của đồ án). Backend vẫn giữ nguyên hỗ trợ `orderType=STANDARD` qua API để app này gọi tới sau. Chưa có yêu cầu cụ thể nào về app này ngoài việc biết nó sẽ tồn tại.
