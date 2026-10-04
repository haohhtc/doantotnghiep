import pandas as pd
from sqlalchemy import text


def load_dimension(engine, df, table_name):
    """Full-refresh: xoa toan bo dimension roi nap lai (don gian cho quy mo do an)."""
    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        conn.execute(text(f"DELETE FROM {table_name}"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
    df.to_sql(table_name, engine, if_exists="append", index=False)


def load_facts(engine, df, table_name):
    """Full-refresh: xoa toan bo fact roi nap lai (giai doan dau, chua lam incremental)."""
    if df.empty:
        return
    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        conn.execute(text(f"DELETE FROM {table_name}"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
    df.to_sql(table_name, engine, if_exists="append", index=False)


def upsert_snapshot(engine, df, table_name="fact_inventory_snapshot"):
    """fact_inventory_snapshot phai tich luy theo ngay (khong duoc xoa het moi lan chay ETL,
    khac voi cac fact khac) - dung INSERT ... ON DUPLICATE KEY UPDATE tren
    (product_key, warehouse_key, time_key) thay vi full-refresh."""
    if df.empty:
        return
    with engine.begin() as conn:
        for row in df.to_dict("records"):
            conn.execute(text(f"""
                INSERT INTO {table_name} (product_key, warehouse_key, time_key, quantity_on_hand)
                VALUES (:product_key, :warehouse_key, :time_key, :quantity_on_hand)
                ON DUPLICATE KEY UPDATE quantity_on_hand = VALUES(quantity_on_hand)
            """), row)


def generate_dim_time(start_date, end_date):
    dates = pd.date_range(start_date, end_date, freq="D")
    df = pd.DataFrame({"full_date": dates})
    df["time_key"] = df["full_date"].dt.strftime("%Y%m%d").astype(int)
    df["day"] = df["full_date"].dt.day
    df["month"] = df["full_date"].dt.month
    df["quarter"] = df["full_date"].dt.quarter
    df["year"] = df["full_date"].dt.year
    df["day_of_week"] = df["full_date"].dt.dayofweek + 1  # 1=Mon .. 7=Sun
    df["is_weekend"] = df["day_of_week"].isin([6, 7])
    return df[["time_key", "full_date", "day", "month", "quarter", "year", "day_of_week", "is_weekend"]]


if __name__ == "__main__":
    import sys
    from datetime import date, timedelta
    from pathlib import Path

    sys.path.append(str(Path(__file__).resolve().parent.parent))
    from config.db_config import get_oltp_engine, get_dw_engine
    from extract.extract_oltp import extract_products, extract_suppliers, extract_warehouses, extract_customers

    oltp = get_oltp_engine()
    dw = get_dw_engine()

    load_dimension(dw, extract_products(oltp), "dim_product")
    load_dimension(dw, extract_suppliers(oltp), "dim_supplier")
    load_dimension(dw, extract_warehouses(oltp), "dim_warehouse")
    load_dimension(dw, extract_customers(oltp), "dim_customer")

    time_df = generate_dim_time(date.today() - timedelta(days=210), date.today() + timedelta(days=30))
    load_dimension(dw, time_df, "dim_time")

    print("Da nap xong 4 dimension + dim_time.")
