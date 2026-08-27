# Yêu cầu chức năng chi tiết

Ký hiệu: **[BE1]** = Thành viên 1 (Backend/Frontend) · **[BE2]** = Thành viên 2 (Data/AI)

## 1. Quản lý hệ thống `[BE1]`

| Mã | Chức năng | Ghi chú |
|---|---|---|
| SYS-01 | Đăng nhập | JWT-based, lưu token phía client |
| SYS-02 | Đăng xuất | Invalidate token / clear session |
| SYS-03 | Quản lý người dùng | CRUD User, khóa/mở tài khoản |
| SYS-04 | Phân quyền người dùng | Role-based (Admin/Quản lý kho/Nhân viên bán hàng/...), Permission theo module |

## 2. Quản lý danh mục `[BE1]`

| Mã | Chức năng | Ghi chú |
|---|---|---|
| CAT-01 | Quản lý sản phẩm | CRUD, mã SKU, đơn vị tính, giá, danh mục |
| CAT-02 | Quản lý danh mục sản phẩm | CRUD, có thể phân cấp cha/con |
| CAT-03 | Quản lý nhà cung cấp | CRUD, thông tin liên hệ |
| CAT-04 | Quản lý kho | CRUD, địa chỉ, người quản lý kho |

## 3. Quản lý nhập hàng `[BE1]`

| Mã | Chức năng | Ghi chú |
|---|---|---|
| IN-01 | Tạo phiếu nhập hàng từ NCC | Chọn NCC, kho nhận, danh sách sản phẩm |
| IN-02 | Quản lý chi tiết phiếu nhập | Sản phẩm, số lượng, đơn giá |
| IN-03 | Cập nhật tồn kho khi nhập hàng | Transaction: tăng `stock.quantity` + ghi `stock_transaction` (IN) |
| IN-04 | Theo dõi lịch sử nhập hàng | Lọc theo NCC/kho/thời gian |

## 4. Quản lý bán hàng `[BE1]`

| Mã | Chức năng | Ghi chú |
|---|---|---|
| SALE-01 | Khách hàng xem/chọn sản phẩm | Danh sách sản phẩm còn hàng |
| SALE-02 | Tạo đơn hàng | Chọn khách hàng, kho xuất, sản phẩm |
| SALE-03 | Quản lý chi tiết đơn hàng | Sản phẩm, số lượng, đơn giá |
| SALE-04 | Xác nhận/hủy đơn hàng | Trạng thái: PENDING → CONFIRMED / CANCELLED |
| SALE-05 | Tự động xuất kho khi xác nhận đơn | Transaction: giảm `stock.quantity` + ghi `stock_transaction` (OUT). **Ràng buộc:** chặn xác nhận nếu tồn kho không đủ |

## 5. Quản lý tồn kho `[BE1]`

| Mã | Chức năng | Ghi chú |
|---|---|---|
| INV-01 | Theo dõi số lượng tồn hiện tại | Theo từng sản phẩm × kho |
| INV-02 | Lịch sử nhập/xuất | Từ bảng `stock_transaction` |
| INV-03 | Tồn kho theo sản phẩm và kho | Báo cáo/lọc |
| INV-04 | Kiểm kê/điều chỉnh tồn kho | Tạo phiếu kiểm kê, so sánh hệ thống vs thực tế, ghi nhận chênh lệch (ADJUST) |
| INV-05 | Cảnh báo sản phẩm sắp hết hàng | Ngưỡng tối thiểu (min stock) theo sản phẩm/kho, có thể kết hợp AI Stock Risk `[BE2]` |

## 6. Data Warehouse & ETL `[BE2]`

- **Extract:** đọc dữ liệu từ MySQL OLTP (User, Product, Supplier, Warehouse, GoodsReceipt, SalesOrder, StockTransaction...)
- **Transform:** làm sạch, chuẩn hóa (dedup, xử lý null, quy đổi đơn vị, tính surrogate key), tổng hợp theo ngày
- **Load:** nạp vào Data Warehouse (star schema)

Nhóm bảng dự kiến: xem [`../03-database/erd-dw.md`](../03-database/erd-dw.md)

## 7. Business Intelligence `[BE2]`

Dashboard Power BI kết nối trực tiếp Data Warehouse:
- Tổng quan tình hình kho
- Doanh thu và số lượng bán
- Số lượng nhập/xuất theo thời gian
- Tình trạng tồn kho
- Sản phẩm bán chạy / tồn lâu
- Tồn kho theo từng kho
- Phân tích nhà cung cấp
- Xu hướng biến động nhập/xuất/tồn

## 8. Chức năng AI `[BE2]`

| Mã | Chức năng | Input | Output |
|---|---|---|---|
| AI-01 | Forecasting nhu cầu sản phẩm | Lịch sử bán hàng (fact_sales) | Dự báo số lượng bán 7/14/30 ngày tới theo sản phẩm |
| AI-02 | Stock Risk (nguy cơ thiếu hàng) | Tồn kho hiện tại + kết quả AI-01 | Danh sách sản phẩm nguy cơ hết hàng + đề xuất số lượng nhập |
| AI-03 | Anomaly Detection | Lịch sử nhập/xuất/tồn | Danh sách giao dịch/biến động bất thường (VD: xuất kho tăng đột biến) |
| AI-04 | AI Chatbot | Câu hỏi tự nhiên + dữ liệu hệ thống (qua API/DW) | Câu trả lời dựa trên dữ liệu thực tế (RAG hoặc query có cấu trúc) |

Chi tiết API giữa các service: xem [`../05-api-contract/api-endpoints.md`](../05-api-contract/api-endpoints.md)
