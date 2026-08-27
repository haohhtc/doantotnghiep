# Chia việc & Timeline

> Điền tên thật + ngày cụ thể khi nhóm chốt lịch bảo vệ. Timeline dưới là khung đề xuất theo 12 tuần, điều chỉnh theo lịch môn học thực tế.

## Nguyên tắc chia việc

- **Thành viên 1 (Backend/Frontend):** sở hữu toàn bộ `backend/`, `frontend/`, CSDL OLTP.
- **Thành viên 2 (Data/AI):** sở hữu toàn bộ `etl/`, `data-warehouse/`, `ai-services/`, `bi/`.
- **Điểm tích hợp** (cả hai cùng thống nhất TRƯỚC khi code): schema các bảng OLTP mà ETL sẽ đọc, và API contract giữa Backend ↔ AI Services (`docs/05-api-contract/api-endpoints.md`). Đổi schema OLTP phải báo trước cho Thành viên 2.

## Timeline đề xuất (12 tuần)

| Tuần | Thành viên 1 | Thành viên 2 | Milestone chung |
|---|---|---|---|
| 1–2 | Setup Spring Boot, thiết kế + tạo schema OLTP, Auth (login/JWT) | Setup ETL/AI project, thiết kế star schema DW | Chốt ERD OLTP + DW |
| 3–4 | CRUD Danh mục (Product, Category, Supplier, Warehouse) + Frontend tương ứng | Viết ETL extract từ OLTP → load thô vào DW (chưa cần đủ dữ liệu) | Demo CRUD danh mục |
| 5–6 | Module Nhập hàng + cập nhật tồn kho | ETL transform đầy đủ (dimension + fact_inbound), bắt đầu Power BI dashboard tồn kho | Có dữ liệu inbound chảy tới DW |
| 7–8 | Module Bán hàng (đơn hàng, xác nhận/hủy, xuất kho tự động) | Hoàn thiện fact_sales, fact_stock_movement; Forecasting v1 (baseline model) | Demo luồng bán hàng → tồn kho → DW |
| 9 | Module Tồn kho (kiểm kê, cảnh báo), phân quyền chi tiết | Stock Risk service (kết hợp forecast + tồn kho) | Tích hợp cảnh báo AI vào Frontend |
| 10 | Hoàn thiện Frontend, fix bug tích hợp | Anomaly Detection + AI Chatbot | Demo AI Chatbot trả lời câu hỏi thật |
| 11 | Kiểm thử end-to-end, viết tài liệu | Hoàn thiện Power BI dashboard, kiểm thử ETL | Test toàn hệ thống |
| 12 | Viết báo cáo khóa luận, chuẩn bị bảo vệ | Viết báo cáo khóa luận, chuẩn bị bảo vệ | Nộp báo cáo |

## Danh sách task chi tiết (điền vào công cụ quản lý task nhóm chọn — Trello/Jira/GitHub Projects)

### Thành viên 1
- [ ] Setup project Spring Boot (pom.xml, cấu trúc package, Flyway, Swagger)
- [ ] Auth: login, JWT, phân quyền (Role/Permission)
- [ ] Module Danh mục: Product, ProductCategory, Supplier, Warehouse (CRUD đầy đủ)
- [ ] Module Nhập hàng: GoodsReceipt + cập nhật Stock (transaction)
- [ ] Module Bán hàng: SalesOrder + xác nhận → xuất kho tự động (transaction)
- [ ] Module Tồn kho: Stock, StockTransaction (lịch sử), StockTake (kiểm kê), StockAlert
- [ ] Frontend: layout chung (sidebar theo module, giống DMS), trang Login, CRUD UI từng module
- [ ] Tích hợp Frontend gọi AI Services (hiển thị cảnh báo/dự báo/chatbot)

### Thành viên 2
- [ ] Setup Data Warehouse (schema dimension + fact)
- [ ] ETL: extract từ OLTP (kết nối MySQL, đọc bảng theo `docs/03-database/erd-oltp.md`)
- [ ] ETL: transform (làm sạch, surrogate key, tính toán)
- [ ] ETL: load vào DW (incremental)
- [ ] Power BI: kết nối DW, xây 8 dashboard theo yêu cầu
- [ ] AI Forecasting: chọn mô hình, train, expose API `/forecast`
- [ ] AI Stock Risk: kết hợp forecast + tồn kho, expose API `/stock-risk`
- [ ] AI Anomaly Detection: chọn phương pháp, expose API `/anomalies`
- [ ] AI Chatbot: thiết kế prompt/RAG dựa trên DW, expose API `/chat`

## Công cụ quản lý task đề xuất

Chọn 1 trong: GitHub Projects (Kanban gắn trực tiếp với repo/issues), Trello, hoặc Notion. Ghi lại lựa chọn + link board tại đây sau khi nhóm chốt.
