# Data Warehouse

Star schema riêng biệt với CSDL OLTP. File trong `schema/` được `docker-compose.yml` tự mount vào container `mysql-dw` (`/docker-entrypoint-initdb.d`) — chạy tự động khi container khởi tạo lần đầu.

Thiết kế đầy đủ: [`../docs/03-database/erd-dw.md`](../docs/03-database/erd-dw.md)

```
schema/
├── 01_dimensions.sql   ← DDL day du: dim_product, dim_supplier, dim_warehouse, dim_customer, dim_time
└── 02_facts.sql        ← DDL day du: fact_inbound, fact_sales, fact_stock_movement, fact_inventory_snapshot
```

Schema đã viết sẵn (surrogate key riêng, không dùng ID gốc OLTP). `dim_time` cần 1 script seed riêng (date spine) — tự viết trong `etl/` hoặc chèn tay khi cần test.

> Nếu sửa file sau khi container đã chạy 1 lần, cần xóa volume `erp_dw_data` để init lại: `docker compose down -v mysql-dw` rồi `docker compose up -d`.
