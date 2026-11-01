import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from datetime import date
import pandas as pd


FACT_TONKHO_COLS = [
    "snapshot_date", "snapshot_year", "snapshot_month",
    "product_code", "product_name", "category_code", "category_name",
    "parent_category_code", "parent_category_name",
    "warehouse_code", "warehouse_name", "warehouse_type",
    "branch_code", "branch_name",
    "quantity_on_hand", "avg_unit_price", "inventory_value",
    "stock_status",
    "slicer_product", "slicer_warehouse",
    "etl_batch_date",
]

FACT_MOVE_COLS = [
    "txn_id", "txn_date", "txn_year", "txn_month",
    "product_code", "product_name", "category_code", "category_name",
    "warehouse_code", "warehouse_name", "warehouse_type",
    "branch_code", "branch_name",
    "txn_type", "txn_type_vn", "reference_type", "reference_type_vn",
    "quantity",
    "slicer_product", "slicer_warehouse",
    "etl_batch_date",
]


def transform_tonkho(df_raw, snapshot_dt=None):
    """Stock snapshot -> fact_tonkho (wide, denormalized)."""
    if snapshot_dt is None:
        snapshot_dt = date.today()
    df = df_raw.copy()

    df["snapshot_date"]  = snapshot_dt
    df["snapshot_year"]  = snapshot_dt.year
    df["snapshot_month"] = snapshot_dt.month

    df["inventory_value"] = (
        df["quantity_on_hand"].fillna(0) * df["avg_unit_price"].fillna(0)
    ).round(2)

    def _status(qty):
        if qty <= 0:   return "Het hang"
        if qty < 500:  return "Ton thap"
        return "Du hang"
    df["stock_status"] = df["quantity_on_hand"].apply(_status)

    df["slicer_product"]   = df["product_code"].fillna("") + " - " + df["product_name"].fillna("")
    df["slicer_warehouse"] = df["warehouse_code"].fillna("") + " - " + df["warehouse_name"].fillna("")
    df["etl_batch_date"]   = date.today()

    for c in ["parent_category_code", "parent_category_name", "branch_code", "branch_name"]:
        if c not in df.columns:
            df[c] = None

    return df[FACT_TONKHO_COLS]


TYPE_VN = {"IN": "Nhap kho", "OUT": "Xuat kho", "ADJUST": "Dieu chinh"}
REF_VN  = {
    "GOODS_RECEIPT":   "Nhap mua hang",
    "SALES_ORDER":     "Xuat theo don ban",
    "INVOICE":         "Xuat theo hoa don",
    "STOCK_TAKE":      "Kiem ke kho",
    "SEED_ADJUSTMENT": "Dieu chinh ban dau",
    "DELIVERY_ORDER":  "Xuat giao hang",
    "PURCHASE_RETURN": "Tra hang mua",
}


def transform_tonkho_movement(df_raw):
    """stock_transaction -> fact_tonkho_movement (wide, denormalized)."""
    df = df_raw.copy()

    df["txn_date"]  = pd.to_datetime(df["txn_date"]).dt.date
    df["txn_year"]  = pd.to_datetime(df["txn_date"]).dt.year
    df["txn_month"] = pd.to_datetime(df["txn_date"]).dt.month

    df["txn_type_vn"]       = df["txn_type"].map(TYPE_VN).fillna(df["txn_type"])
    df["reference_type_vn"] = df["reference_type"].map(REF_VN).fillna(df["reference_type"])

    df["slicer_product"]   = df["product_code"].fillna("") + " - " + df["product_name"].fillna("")
    df["slicer_warehouse"] = df["warehouse_code"].fillna("") + " - " + df["warehouse_name"].fillna("")
    df["etl_batch_date"]   = date.today()

    for c in ["branch_code", "branch_name"]:
        if c not in df.columns:
            df[c] = None

    return df[FACT_MOVE_COLS]
