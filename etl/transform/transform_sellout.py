import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from datetime import date

import pandas as pd

# Cot insert vao fact_sellout, dung thu tu cho load_fact_sellout
FACT_SELLOUT_COLS = [
    "product_key", "customer_key", "warehouse_key", "time_key",
    "so_id", "so_detail_id",
    "so_order_number", "so_order_date",
    "so_order_year", "so_order_month",
    "so_order_status", "so_order_status_vn",
    "sos_order_status_icon_vn", "sos_order_type_vn", "source_type",
    "product_code", "product_name", "product_uom_code",
    "category_code", "category_name",
    "parent_category_code", "parent_category_name",
    "product_group_code", "product_group_name",
    "customer_code", "customer_name", "customer_address",
    "customer_province", "customer_district", "customer_ward",
    "customer_channel_code", "customer_channel_name",
    "customer_group_code", "customer_group_name",
    "branch_code", "branch_name",
    "region_name", "selling_zone_name", "branch_territory_name",
    "route_code", "route_name", "selling_category_code",
    "salesperson_code", "salesperson_name",
    "supervisor_code", "supervisor_name",
    "warehouse_code",
    "quantity", "unit_price", "line_amount",
    "tax_rate", "tax_amount", "line_amount_after_tax",
    "discount_amount", "line_amount_before_discount",
    "invoice_number", "invoice_date", "invoice_line_total",
    "delivery_number", "delivery_date", "delivery_quantity",
    "slicer_customer", "slicer_distributor",
    "slicer_salesman", "slicer_supervisor", "slicer_product",
    "etl_batch_date",
]


def transform_sellout(df_raw, dim_product, dim_customer, dim_warehouse):
    """Nhan DataFrame tu extract_raw.extract_sellout(), tra ve DataFrame san sang load vao
    fact_sellout. Thiet ke wide-denormalized (khac star schema cua fact_sales/fact_inbound) -
    khong bat buoc inner-join voi dim (mot vai don hang co the chua co surrogate key, van giu
    dong de khong mat du lieu ban hang that - surrogate key la NULL trong truong hop do)."""
    df = df_raw.drop_duplicates(subset=["so_detail_id"]).copy()

    df["time_key"] = pd.to_datetime(df["so_order_date"]).dt.strftime("%Y%m%d").astype(int)

    # extract_sellout() tra ve product_code/customer_code/warehouse_code (khong tra id goc OLTP),
    # nen tra surrogate key qua code thay vi id.
    pm = dim_product.rename(columns={"product_code": "_pc", "product_key": "_pk"})[["_pc", "_pk"]]
    df = df.merge(pm, left_on="product_code", right_on="_pc", how="left").rename(columns={"_pk": "product_key"})

    cm = dim_customer.rename(columns={"customer_code": "_cc", "customer_key": "_ck"})[["_cc", "_ck"]]
    df = df.merge(cm, left_on="customer_code", right_on="_cc", how="left").rename(columns={"_ck": "customer_key"})

    wm = dim_warehouse.rename(columns={"warehouse_code": "_wc", "warehouse_key": "_wk"})[["_wc", "_wk"]]
    df = df.merge(wm, left_on="warehouse_code", right_on="_wc", how="left").rename(columns={"_wk": "warehouse_key"})

    df["slicer_customer"] = df["customer_code"].fillna("") + " - " + df["customer_name"].fillna("")
    df["slicer_distributor"] = df["branch_code"].fillna("") + " - " + df["branch_name"].fillna("")
    df["slicer_salesman"] = df["salesperson_code"].fillna("") + " - " + df["salesperson_name"].fillna("")
    df["slicer_supervisor"] = df["supervisor_code"].fillna("") + " - " + df["supervisor_name"].fillna("")
    df["slicer_product"] = df["product_code"].fillna("") + " - " + df["product_name"].fillna("")

    df["etl_batch_date"] = date.today()

    return df[FACT_SELLOUT_COLS]


if __name__ == "__main__":
    from config.db_config import get_dw_engine
    from extract.extract_raw import extract_sellout

    dw = get_dw_engine()
    dim_product = pd.read_sql("SELECT product_id, product_code, product_key FROM dim_product", dw)
    dim_customer = pd.read_sql("SELECT customer_id, customer_code, customer_key FROM dim_customer", dw)
    dim_warehouse = pd.read_sql("SELECT warehouse_id, warehouse_code, warehouse_key FROM dim_warehouse", dw)

    raw = extract_sellout(dw)
    fact_sellout = transform_sellout(raw, dim_product, dim_customer, dim_warehouse)
    print(fact_sellout.head())
    print(f"\n{len(raw)} dong raw -> {len(fact_sellout)} dong fact_sellout")
