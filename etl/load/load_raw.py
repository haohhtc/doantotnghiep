"""Lop Raw/Staging: copy nguyen ban (khong bien doi) tu OLTP vao bang raw_* trong DW.
Day la buoc 'E + L tho' cua ELT - Transform phia sau doc tu cac bang raw_* nay (xem
etl/extract/extract_raw.py), khong truy van truc tiep OLTP nua."""
import pandas as pd
from sqlalchemy import text

RAW_TABLES = [
    "product_category", "product", "supplier", "warehouse", "branch",
    "customer", "customer_channel", "uom", "tax_group",
    "region", "province", "district", "ward",
    "goods_receipt", "goods_receipt_detail",
    "sales_order", "sales_order_detail",
    "stock_transaction", "stock",
]


def copy_table_to_raw(oltp_engine, dw_engine, table_name):
    """SELECT * nguyen ban tu 1 bang OLTP -> full-refresh vao raw_{table_name} trong DW."""
    df = pd.read_sql(f"SELECT * FROM {table_name}", oltp_engine)
    raw_table = f"raw_{table_name}"
    with dw_engine.begin() as conn:
        conn.execute(text(f"DROP TABLE IF EXISTS {raw_table}"))
    df.to_sql(raw_table, dw_engine, if_exists="replace", index=False)
    return len(df)


def load_all_raw(oltp_engine, dw_engine, tables=None):
    tables = tables or RAW_TABLES
    counts = {}
    for t in tables:
        counts[t] = copy_table_to_raw(oltp_engine, dw_engine, t)
    return counts


if __name__ == "__main__":
    import sys
    from pathlib import Path

    sys.path.append(str(Path(__file__).resolve().parent.parent))
    from config.db_config import get_oltp_engine, get_dw_engine

    oltp = get_oltp_engine()
    dw = get_dw_engine()

    counts = load_all_raw(oltp, dw)
    for t, n in counts.items():
        print(f"  raw_{t}: {n} dong")
