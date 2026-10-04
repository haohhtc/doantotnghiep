import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

import pandas as pd

from transform.cleaning import clean_source_rows


def transform_inbound(receipts_df, dim_product, dim_supplier, dim_warehouse):
    df = clean_source_rows(receipts_df, required_cols=["product_id", "supplier_id", "warehouse_id", "doc_date"])

    df = df.merge(dim_product[["product_id", "product_key"]], on="product_id", how="inner")
    df = df.merge(dim_supplier[["supplier_id", "supplier_key"]], on="supplier_id", how="inner")
    df = df.merge(dim_warehouse[["warehouse_id", "warehouse_key"]], on="warehouse_id", how="inner")

    df["time_key"] = pd.to_datetime(df["doc_date"]).dt.strftime("%Y%m%d").astype(int)

    return df[["product_key", "supplier_key", "warehouse_key", "time_key", "quantity", "unit_price", "amount"]]


if __name__ == "__main__":
    from config.db_config import get_oltp_engine, get_dw_engine
    from extract.extract_oltp import extract_goods_receipts

    oltp = get_oltp_engine()
    dw = get_dw_engine()

    receipts_raw = extract_goods_receipts(oltp)
    dim_product = pd.read_sql("SELECT product_id, product_key FROM dim_product", dw)
    dim_supplier = pd.read_sql("SELECT supplier_id, supplier_key FROM dim_supplier", dw)
    dim_warehouse = pd.read_sql("SELECT warehouse_id, warehouse_key FROM dim_warehouse", dw)

    fact_inbound = transform_inbound(receipts_raw, dim_product, dim_supplier, dim_warehouse)
    print(fact_inbound.head())
    print(f"\n{len(receipts_raw)} dong OLTP -> {len(fact_inbound)} dong fact_inbound")
