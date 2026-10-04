"""Doi chieu OLTP <-> DW va kiem tra du lieu theo thang, sau khi chay ETL."""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))

import pandas as pd
from sqlalchemy import text

from config.db_config import get_oltp_engine, get_dw_engine


def _compare(label, oltp_count, oltp_amount, dw_count, dw_amount):
    ok = oltp_count == dw_count and abs(float(oltp_amount) - float(dw_amount)) < 1
    status = "OK" if ok else "LECH"
    print(f"[{status}] {label}: OLTP {oltp_count} dong / {oltp_amount:,.0f} d  <->  "
          f"DW {dw_count} dong / {dw_amount:,.0f} d")
    return ok


def reconcile_sales(oltp, dw):
    oltp_row = pd.read_sql("""
        SELECT COUNT(*) AS n, COALESCE(SUM(d.amount), 0) AS total
        FROM sales_order so JOIN sales_order_detail d ON d.sales_order_id = so.id
        WHERE so.status = 'CONFIRMED'
    """, oltp).iloc[0]
    dw_row = pd.read_sql("SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS total FROM fact_sales", dw).iloc[0]
    return _compare("fact_sales", oltp_row["n"], oltp_row["total"], dw_row["n"], dw_row["total"])


def reconcile_inbound(oltp, dw):
    oltp_row = pd.read_sql("""
        SELECT COUNT(*) AS n, COALESCE(SUM(d.amount), 0) AS total
        FROM goods_receipt gr JOIN goods_receipt_detail d ON d.goods_receipt_id = gr.id
        WHERE gr.status = 'CLOSED'
    """, oltp).iloc[0]
    dw_row = pd.read_sql("SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS total FROM fact_inbound", dw).iloc[0]
    return _compare("fact_inbound", oltp_row["n"], oltp_row["total"], dw_row["n"], dw_row["total"])


def reconcile_stock(oltp, dw, snapshot_date):
    """OLTP ton kho (bang 'stock') phai khop DW ton kho (fact_inventory_snapshot ngay hom nay) -
    yeu cau Tuan 6: "Kiem tra so lieu: OLTP ton kho = DW ton kho"."""
    time_key = int(snapshot_date.strftime("%Y%m%d"))
    oltp_df = pd.read_sql("SELECT product_id, warehouse_id, quantity FROM stock", oltp)
    dw_df = pd.read_sql(f"""
        SELECT p.product_id, w.warehouse_id, f.quantity_on_hand
        FROM fact_inventory_snapshot f
        JOIN dim_product p ON p.product_key = f.product_key
        JOIN dim_warehouse w ON w.warehouse_key = f.warehouse_key
        WHERE f.time_key = {time_key}
    """, dw)

    merged = oltp_df.merge(dw_df, on=["product_id", "warehouse_id"], how="outer", indicator=True)
    merged["quantity"] = merged["quantity"].fillna(0)
    merged["quantity_on_hand"] = merged["quantity_on_hand"].fillna(0)
    mismatched = merged[
        (merged["_merge"] != "both") | ((merged["quantity"] - merged["quantity_on_hand"]).abs() > 0.001)
    ]

    if mismatched.empty:
        print(f"[OK] fact_inventory_snapshot ({time_key}): ton kho OLTP = DW tren ca "
              f"{len(merged)} cap san pham x kho")
    else:
        print(f"[LECH] fact_inventory_snapshot ({time_key}): {len(mismatched)}/{len(merged)} "
              f"cap san pham x kho khong khop")
        print(mismatched.to_string(index=False))
    return mismatched.empty


def check_monthly_sales(dw):
    """In doanh so theo thang + canh bao thang nao co du lieu nhung bang 0 don (nghi thieu du lieu)."""
    df = pd.read_sql("""
        SELECT t.year, t.month, COUNT(*) AS so_dong, SUM(f.amount) AS doanh_so
        FROM fact_sales f JOIN dim_time t ON t.time_key = f.time_key
        GROUP BY t.year, t.month
        ORDER BY t.year, t.month
    """, dw)
    print("\nDoanh so theo thang (fact_sales):")
    print(df.to_string(index=False))

    if len(df) >= 2:
        df["year"] = df["year"].astype(int)
        df["month"] = df["month"].astype(int)
        full_months = pd.period_range(
            start=f"{int(df.iloc[0]['year'])}-{int(df.iloc[0]['month']):02d}",
            end=f"{int(df.iloc[-1]['year'])}-{int(df.iloc[-1]['month']):02d}",
            freq="M",
        )
        have_months = {(int(r["year"]), int(r["month"])) for _, r in df.iterrows()}
        missing = [str(p) for p in full_months if (p.year, p.month) not in have_months]
        if missing:
            print(f"[CANH BAO] Cac thang khong co don ban nao trong khoang du lieu: {missing}")
        else:
            print("[OK] Khong co thang nao bi trong trong khoang du lieu.")


if __name__ == "__main__":
    from datetime import date

    oltp = get_oltp_engine()
    dw = get_dw_engine()

    print("=== Doi chieu OLTP vs Data Warehouse ===")
    reconcile_sales(oltp, dw)
    reconcile_inbound(oltp, dw)
    reconcile_stock(oltp, dw, date.today())

    check_monthly_sales(dw)
