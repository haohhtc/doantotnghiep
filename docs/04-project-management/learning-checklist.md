# Checklist: Cần học & cần chuẩn bị thêm

## Thành viên 1 (Backend Java + Frontend React)

- [ ] JPA quan hệ (`@OneToMany`/`@ManyToOne`, cascade, lazy loading) — cần cho GoodsReceipt→Detail, SalesOrder→Detail
- [ ] `@Transactional` + rollback — bắt buộc cho luồng xác nhận đơn hàng (trừ kho) và nhập hàng (cộng kho), sai chỗ này là bug nặng nhất của đồ án
- [ ] Validation (`@Valid`, Bean Validation) + xử lý lỗi nghiệp vụ rõ ràng (VD: "không đủ tồn kho")
- [ ] Chọn 1 UI library free cho React để giống phong cách DMS mà không phải tự viết CSS: **Ant Design** hoặc **MUI (Material UI)** đều có sẵn DataTable/Form/Sidebar layout — nên chốt sớm, ảnh hưởng toàn bộ `frontend/`
- [ ] React Hook Form (form nhập liệu) + Axios interceptor (tự gắn JWT, xử lý 401 redirect login)
- [ ] `@PreAuthorize` / method security — để phân quyền thật sự chặn API, không chỉ ẩn nút trên UI

## Thành viên 2 (Data/AI Python)

- [ ] Pandas transform cơ bản (groupby, merge, pivot) — dùng nhiều trong ETL
- [ ] Time series cơ bản: moving average / exponential smoothing trước khi nhảy vào Prophet/ARIMA — đồ án không cần model phức tạp, chính xác vừa đủ + giải thích được là đủ điểm
- [ ] Anomaly detection: bắt đầu bằng Z-score/IQR (dễ giải thích trong báo cáo) rồi mới tính đến Isolation Forest nếu còn thời gian
- [ ] FastAPI cơ bản: routing, Pydantic model, kết nối MySQL qua SQLAlchemy
- [ ] Gọi LLM API (Claude/OpenAI) cho chatbot — cân nhắc bắt đầu bằng cách đơn giản: phân loại câu hỏi (intent) → chạy query SQL định sẵn → đưa kết quả cho LLM diễn giải thành câu trả lời, KHÔNG cần RAG phức tạp cho phạm vi khóa luận
- [ ] Power BI: DAX cơ bản (measure, calculated column) + cách khai báo relationship giữa fact/dimension trong Model view

## Cả hai

- [ ] Đọc lại `docs/04-project-management/git-workflow.md` và thực hành branch/PR thật (dễ bỏ qua khi chỉ có 2 người)
- [ ] Docker cơ bản — đủ để đọc log khi `docker compose up` lỗi, không cần chuyên sâu

## Cần CHUẨN BỊ / LẤY THÊM (quan trọng, dễ bị quên)

- [ ] **Data mẫu lịch sử đủ lớn** — Forecasting/Anomaly Detection/BI cần vài THÁNG dữ liệu bán hàng/nhập hàng để có ý nghĩa, không thể demo với vài dòng test. Nên viết 1 script sinh data giả lập (random có xu hướng + seasonality) sớm, đừng để cuối kỳ mới lo.
- [ ] Quy định format báo cáo khóa luận của trường/khoa (bìa, mục lục, số chương...) — hỏi GVHD sớm để không phải sửa lại toàn bộ báo cáo cuối kỳ
- [ ] Lịch chốt đề tài + lịch bảo vệ chính thức — cập nhật vào `docs/04-project-management/milestones.md`
- [ ] Nếu dùng Claude/OpenAI API cho chatbot: đăng ký API key riêng (có phí nhỏ theo request) — không dùng chung tài khoản công ty
- [ ] Repo Git chung (GitHub/GitLab) — xem tin nhắn trước, cần tạo trước khi 2 người code song song

## Ưu tiên làm trước (theo thứ tự)

1. Chốt UI library Frontend + tạo remote Git chung
2. Viết script sinh data mẫu lịch sử (cả 2 cùng cần, nên làm sớm nhất)
3. Thành viên 1: code xong CRUD Danh mục theo mẫu `auth/`+`user/`
4. Thành viên 2: ETL chạy được với data mẫu, có số liệu vào DW để BI/AI có cái để tính
