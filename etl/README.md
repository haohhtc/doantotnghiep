# ETL — kiến trúc ELT (Extract + Load raw → Transform trong DW → Load fact/dim)

Python. Copy nguyên bản OLTP vào lớp Raw/Staging trong Data Warehouse, transform từ đó ra star schema — không transform trực tiếp trên dữ liệu OLTP sống.

## Luồng dữ liệu

```
MySQL OLTP (erp_qlkho_oltp)
        │  (E)xtract + (L)oad — copy nguyên bản, không biến đổi
        ▼
raw_* trong Data Warehouse (vd raw_product, raw_sales_order...)
        │  (T)ransform — làm sạch, đổi surrogate key
        ▼
dim_* / fact_* trong Data Warehouse (star schema)
```

Đây là kiểu **ELT** (khác ETL cổ điển transform trước khi load) — lớp Raw giữ bản sao y nguyên OLTP tại thời điểm chạy, tách rời bước copy dữ liệu khỏi logic transform. Pipeline chỉ chạy theo lô (batch), **không tự động real-time** — mỗi lần web có dữ liệu mới, cần chạy lại `python run_etl.py` để đồng bộ.

## Cấu trúc

```
etl/
├── config/db_config.py           ← kết nối OLTP + DW (đọc từ .env)
├── extract/
│   ├── extract_oltp.py            ← đọc OLTP sống (chỉ dùng cho load_raw.py + validate.py)
│   └── extract_raw.py             ← đọc bảng raw_* trong DW (dùng cho toàn bộ transform)
├── transform/
│   ├── cleaning.py                ← xử lý dữ liệu trùng/thiếu/không hợp lệ dùng chung
│   ├── transform_sellout.py       ← raw_sales_order (CONFIRMED) + mọi bảng liên quan → fact_sellout
│   ├── transform_inbound.py       ← raw_goods_receipt (CLOSED) → fact_inbound
│   └── transform_inventory.py     ← raw_stock_transaction → fact_stock_movement, raw_stock → fact_inventory_snapshot
├── load/
│   ├── load_raw.py                ← copy nguyên bản OLTP → raw_* trong DW (full-refresh)
│   └── load_dw.py                 ← nạp dimension (full-refresh) + fact (full-refresh) + snapshot (upsert theo ngày)
├── validate.py                    ← đối chiếu OLTP thật ↔ DW + kiểm tra dữ liệu theo tháng
├── prepare_forecast_data.py       ← tổng hợp fact_sellout thành chuỗi ngày x sản phẩm cho AI Forecasting
└── run_etl.py                    ← entry point: copy raw → load dimension → fact_sellout/fact_inbound/fact_stock_movement/fact_inventory_snapshot → đối chiếu
```

**`fact_sellout`** (thay cho `fact_sales` cũ, xem `data-warehouse/schema/04_fact_sellout.sql`): 1 bảng rộng denormalized, khớp tên cột theo 1 template Power BI "FACT_SellOut" có sẵn — Power BI chỉ cần Import đúng 1 bảng này, không cần dựng Data Model/quan hệ. `fact_inbound`/`fact_stock_movement`/`fact_inventory_snapshot` vẫn giữ nguyên dạng star schema (có `dim_product`/`dim_warehouse`/`dim_time` riêng).

Thiết kế schema nguồn/đích: [`../docs/03-database/erd-oltp.md`](../docs/03-database/erd-oltp.md), [`../docs/03-database/erd-dw.md`](../docs/03-database/erd-dw.md). Danh sách bảng được copy vào raw: `etl/load/load_raw.py::RAW_TABLES`.

## Chạy

```bash
pip install -r requirements.txt
python run_etl.py                    # chay toan bo: raw -> dimension -> fact_sellout/fact_inbound/fact_stock_movement/fact_inventory_snapshot -> doi chieu
python prepare_forecast_data.py      # rieng: xuat CSV du lieu ban hang theo ngay cho Forecasting
```
