import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

import pandas as pd

from transform.cleaning import clean_source_rows


def transform_sales(sales_df, dim_product, dim_customer, dim_warehouse):
    df = clean_source_rows(sales_df, required_cols=["product_id", "customer_id", "warehouse_id", "doc_date"])

    df = df.merge(dim_product[["product_id", "product_key"]], on="product_id", how="inner")
    df = df.merge(dim_customer[["customer_id", "customer_key"]], on="customer_id", how="inner")
    df = df.merge(dim_warehouse[["warehouse_id", "warehouse_key"]], on="warehouse_id", how="inner")

    df["time_key"] = pd.to_datetime(df["doc_date"]).dt.strftime("%Y%m%d").astype(int)

    return df[["product_key", "customer_key", "warehouse_key", "time_key", "quantity", "unit_price", "amount"]]


if __name__ == "__main__":
    from config.db_config import get_oltp_engine, get_dw_engine
    from extract.extract_oltp import extract_sales_orders

    oltp = get_oltp_engine()
    dw = get_dw_engine()

    sales_raw = extract_sales_orders(oltp)
    dim_product = pd.read_sql("SELECT product_id, product_key FROM dim_product", dw)
    dim_customer = pd.read_sql("SELECT customer_id, customer_key FROM dim_customer", dw)
    dim_warehouse = pd.read_sql("SELECT warehouse_id, warehouse_key FROM dim_warehouse", dw)

    fact_sales = transform_sales(sales_raw, dim_product, dim_customer, dim_warehouse)
    print(fact_sales.head())
    print(f"\n{len(sales_raw)} dong OLTP -> {len(fact_sales)} dong fact_sales")
