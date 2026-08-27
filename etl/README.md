# ETL — Extract, Transform, Load

Python. Đọc dữ liệu từ MySQL OLTP, làm sạch/chuẩn hóa, nạp vào Data Warehouse (star schema).

## Cấu trúc (khung — chưa có logic, tự code vào đây)

```
etl/
├── config/db_config.py         ← kết nối OLTP + DW (đọc từ .env)
├── extract/extract_oltp.py     ← đọc bảng nguồn từ OLTP
├── transform/
│   ├── transform_sales.py      ← OLTP sales → fact_sales
│   └── transform_inventory.py  ← OLTP stock → fact_inventory_snapshot / fact_stock_movement
├── load/load_dw.py             ← ghi vào Data Warehouse
└── run_etl.py                  ← entry point chạy toàn bộ pipeline
```

Thiết kế schema nguồn/đích: [`../docs/03-database/erd-oltp.md`](../docs/03-database/erd-oltp.md), [`../docs/03-database/erd-dw.md`](../docs/03-database/erd-dw.md)

## Chạy thử (sau khi code xong)

```bash
pip install -r requirements.txt
python run_etl.py
```
