"""Entry point: chay toan bo pipeline ELT - (E)xtract+(L)oad raw -> Transform -> Load fact/dim -> validate.
Buoc 0 copy nguyen ban OLTP vao bang raw_* trong DW; tu buoc 1 tro di, MOI THU doc tu raw_*
(khong con truy van truc tiep OLTP nua) - dung engine OLTP that su chi con lai o buoc 0 va
o validate.py (doi chieu OLTP that voi DW cho chac chan khong lech khi copy raw)."""
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))

import pandas as pd

from config.db_config import get_oltp_engine, get_dw_engine
from load.load_raw import load_all_raw
from extract.extract_raw import (
    extract_products, extract_suppliers, extract_warehouses, extract_customers,
    extract_goods_receipts, extract_sales_orders, extract_stock_transactions, extract_stock_snapshot,
)
from transform.transform_sales import transform_sales
from transform.transform_inbound import transform_inbound
from transform.transform_inventory import transform_stock_movement, transform_inventory_snapshot
from load.load_dw import load_dimension, load_facts, upsert_snapshot, generate_dim_time
import validate


def main():
    oltp = get_oltp_engine()
    dw = get_dw_engine()

    print("== 0. Copy raw (OLTP -> raw_* trong DW, nguyen ban khong bien doi) ==")
    raw_counts = load_all_raw(oltp, dw)
    for t, n in raw_counts.items():
        print(f"  raw_{t}: {n} dong")

    print("\n== 1. Load dimensions (doc tu raw_*) ==")
    load_dimension(dw, extract_products(dw), "dim_product")
    load_dimension(dw, extract_suppliers(dw), "dim_supplier")
    load_dimension(dw, extract_warehouses(dw), "dim_warehouse")
    load_dimension(dw, extract_customers(dw), "dim_customer")
    load_dimension(dw, generate_dim_time(date.today() - timedelta(days=210), date.today() + timedelta(days=30)), "dim_time")

    dim_product = pd.read_sql("SELECT product_id, product_key FROM dim_product", dw)
    dim_supplier = pd.read_sql("SELECT supplier_id, supplier_key FROM dim_supplier", dw)
    dim_warehouse = pd.read_sql("SELECT warehouse_id, warehouse_key FROM dim_warehouse", dw)
    dim_customer = pd.read_sql("SELECT customer_id, customer_key FROM dim_customer", dw)

    print("\n== 2. fact_sales ==")
    fact_sales = transform_sales(extract_sales_orders(dw), dim_product, dim_customer, dim_warehouse)
    load_facts(dw, fact_sales, "fact_sales")
    print(f"Da nap {len(fact_sales)} dong")

    print("\n== 3. fact_inbound ==")
    fact_inbound = transform_inbound(extract_goods_receipts(dw), dim_product, dim_supplier, dim_warehouse)
    load_facts(dw, fact_inbound, "fact_inbound")
    print(f"Da nap {len(fact_inbound)} dong")

    print("\n== 4. fact_stock_movement ==")
    fact_stock_movement = transform_stock_movement(extract_stock_transactions(dw), dim_product, dim_warehouse)
    load_facts(dw, fact_stock_movement, "fact_stock_movement")
    print(f"Da nap {len(fact_stock_movement)} dong")

    print("\n== 5. fact_inventory_snapshot (hom nay) ==")
    fact_snapshot = transform_inventory_snapshot(extract_stock_snapshot(dw), dim_product, dim_warehouse, date.today())
    upsert_snapshot(dw, fact_snapshot)
    print(f"Da upsert {len(fact_snapshot)} dong")

    print("\n== 6. Doi chieu OLTP that vs DW (dam bao copy raw khong bi lech) ==")
    validate.reconcile_sales(oltp, dw)
    validate.reconcile_inbound(oltp, dw)
    validate.reconcile_stock(oltp, dw, date.today())
    validate.check_monthly_sales(dw)


if __name__ == "__main__":
    main()
