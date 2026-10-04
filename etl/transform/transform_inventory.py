import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

import pandas as pd

from transform.cleaning import clean_source_rows


def transform_stock_movement(txn_df, dim_product, dim_warehouse):
    """stock_transaction (IN/OUT/ADJUST) -> fact_stock_movement. ADJUST co the am (giam ton
    sau kiem ke), nen cho phep quantity am - chi loai dong quantity=0."""
    df = clean_source_rows(txn_df, required_cols=["product_id", "warehouse_id", "created_at"],
                            allow_negative_quantity=True)

    df = df.merge(dim_product[["product_id", "product_key"]], on="product_id", how="inner")
    df = df.merge(dim_warehouse[["warehouse_id", "warehouse_key"]], on="warehouse_id", how="inner")

    df["time_key"] = pd.to_datetime(df["created_at"]).dt.strftime("%Y%m%d").astype(int)

    return df[["product_key", "warehouse_key", "time_key", "movement_type", "quantity"]]


def transform_inventory_snapshot(stock_df, dim_product, dim_warehouse, snapshot_date):
    """Ton kho hien tai (bang 'stock') -> 1 dong snapshot cho ngay chay ETL. Load bang upsert
    (khong xoa toan bo fact) de tich luy lich su theo ngay, xem load/load_dw.py:upsert_snapshot."""
    df = clean_source_rows(stock_df, required_cols=["product_id", "warehouse_id"],
                            allow_negative_quantity=True)

    df = df.merge(dim_product[["product_id", "product_key"]], on="product_id", how="inner")
    df = df.merge(dim_warehouse[["warehouse_id", "warehouse_key"]], on="warehouse_id", how="inner")

    df["time_key"] = int(snapshot_date.strftime("%Y%m%d"))

    return df[["product_key", "warehouse_key", "time_key", "quantity_on_hand"]]


if __name__ == "__main__":
    from datetime import date

    import pandas as pd

    from config.db_config import get_oltp_engine, get_dw_engine
    from extract.extract_oltp import extract_stock_transactions, extract_stock_snapshot

    oltp = get_oltp_engine()
    dw = get_dw_engine()

    dim_product = pd.read_sql("SELECT product_id, product_key FROM dim_product", dw)
    dim_warehouse = pd.read_sql("SELECT warehouse_id, warehouse_key FROM dim_warehouse", dw)

    movement = transform_stock_movement(extract_stock_transactions(oltp), dim_product, dim_warehouse)
    print(movement.head())
    print(f"\n{len(movement)} dong fact_stock_movement")

    snapshot = transform_inventory_snapshot(extract_stock_snapshot(oltp), dim_product, dim_warehouse, date.today())
    print(snapshot.head())
    print(f"\n{len(snapshot)} dong fact_inventory_snapshot ({date.today()})")
