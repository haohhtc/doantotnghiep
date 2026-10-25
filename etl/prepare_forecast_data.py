"""Tong hop fact_sellout thanh chuoi thoi gian hang ngay theo tung san pham - dau vao cho AI Forecasting.
Model du bao can 1 dong = 1 ngay = 1 san pham (khong phai tung don hang le), nen phai
SUM quantity/line_amount theo ngay truoc khi dua vao model.
"""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))

import pandas as pd

from config.db_config import get_dw_engine

OUTPUT_PATH = Path(__file__).resolve().parent / "output" / "daily_sales_by_product.csv"


def build_daily_sales_by_product(dw):
    sql = """
        SELECT t.full_date, f.product_code, f.product_name,
               SUM(f.quantity) AS quantity, SUM(f.line_amount) AS amount
        FROM fact_sellout f
        JOIN dim_time t ON t.time_key = f.time_key
        GROUP BY t.full_date, f.product_code, f.product_name
        ORDER BY f.product_code, t.full_date
    """
    return pd.read_sql(sql, dw)


if __name__ == "__main__":
    dw = get_dw_engine()
    df = build_daily_sales_by_product(dw)

    OUTPUT_PATH.parent.mkdir(exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")

    print(df.head(10))
    print(f"\n{len(df)} dong (ngay x san pham), {df['product_code'].nunique()} san pham")
    print(f"Da ghi ra: {OUTPUT_PATH}")
