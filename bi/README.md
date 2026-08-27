# BI — Power BI Dashboard

File `.pbix` không phải text nên không diff tốt trên Git — đặt vào `dashboards/`, đặt tên rõ версion (vd: `ERP_Dashboard_v1.pbix`), và cân nhắc chỉ commit bản mới nhất thay vì mọi version nháp.

## Kết nối nguồn dữ liệu

Power BI Desktop → Get Data → MySQL database → host/port lấy từ `.env` (`DW_DB_HOST`, `DW_DB_PORT` — mặc định `localhost:3307` khi chạy qua `docker-compose.yml` ở thư mục gốc) → connect tới database `erp_qlkho_dw`.

## 8 dashboard cần xây (theo đề bài)

1. Tổng quan tình hình kho
2. Doanh thu và số lượng bán
3. Số lượng nhập/xuất theo thời gian
4. Tình trạng tồn kho
5. Sản phẩm bán chạy
6. Sản phẩm tồn lâu
7. Tồn kho theo từng kho
8. Phân tích nhà cung cấp + xu hướng biến động nhập/xuất/tồn

Nguồn bảng cho từng dashboard: xem [`../docs/03-database/erd-dw.md`](../docs/03-database/erd-dw.md)
