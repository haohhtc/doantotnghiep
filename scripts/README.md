# Scripts

## generate_sample_data.py

Sinh dữ liệu mẫu lịch sử (mặc định 6 tháng) vào CSDL OLTP để Backend/ETL/BI/AI có data thật để demo — không phải vài dòng test vô nghĩa.

**Trước khi chạy:** đã có `.env` đúng (`cp .env.example .env`) và bảng OLTP đã tồn tại — chạy `mvn spring-boot:run` 1 lần (Flyway tự tạo bảng) hoặc chạy tay `docs/03-database/full-schema-oltp.sql`.

```bash
cd scripts
pip install -r requirements.txt
python generate_sample_data.py --months 6

# Sinh lại từ đầu (xóa data seed cũ, không đụng data bạn tự thêm tay):
python generate_sample_data.py --months 6 --force
```

Sinh ra: danh mục (8 category, 80 sản phẩm, 8 NCC, 3 kho, 40 khách hàng), giao dịch nhập/bán mỗi ngày (có xu hướng tăng + cuối tuần bán chạy hơn), kiểm kê cuối tháng, **3 điểm bất thường cố ý** (xuất kho tăng đột biến — để test AI-03 Anomaly Detection) và **5 sản phẩm bị ép tồn thấp** kèm `stock_alert` (để test AI-02 Stock Risk / INV-05).

Chạy xong → chạy tiếp `etl/run_etl.py` để nạp data này vào Data Warehouse cho BI/Forecasting.
