# AI-03 Anomaly Detection - phat hien bien dong BAT THUONG trong nhap/xuat/dieu chinh ton kho.
# Tu xay dung bang phuong phap thong ke TU PHAN VI (IQR / lien gioi Tukey) tren fact_stock_movement
# trong Data Warehouse - KHONG goi LLM/API cua ben thu ba nao, hoan toan giai thich duoc (khac mo
# hinh "hop den"), dung yeu cau cua GVHD la phai tu lam phan AI.
#
# Phuong phap: voi tung (san pham, loai giao dich IN/OUT/ADJUST), tong hop so luong THEO NGAY tu
# lich su (TRUOC ky dang xet - tranh de chinh ky do tu lam lech chuan cua no), tinh khoang
# "binh thuong" bang tu phan vi Q1/Q3:
#     IQR = Q3 - Q1
#     expectedRange = [max(0, Q1 - 1.5*IQR), Q3 + 1.5*IQR]      (lien gioi Tukey, chuan thong ke
#                                                                 pho bien de phat hien outlier)
# Ngay nao trong [from, to] co tong SL nam NGOAI khoang nay -> danh dau BAT THUONG. Can toi thieu
# MIN_HISTORY_POINTS diem du lieu lich su de IQR co y nghia (qua it diem thi bo qua, khong doan bua).
# Chay thu: uvicorn main:app --reload --port 8003
from datetime import date

import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text as sql_text

from db import get_dw_engine

app = FastAPI(title="ERPQLKHO AI Anomaly Detection", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MIN_HISTORY_POINTS = 10
IQR_FENCE_FACTOR = 1.5
SEVERE_IQR_FACTOR = 3.0  # lech > 3 lan IQR so voi lien gioi -> HIGH, con lai (van bat thuong) -> MEDIUM


def _daily_movement(engine, branch_code: str | None) -> pd.DataFrame:
    """Tong SL giao dich kho THEO NGAY, theo tung san pham + loai giao dich (IN/OUT/ADJUST). Mac
    dinh cong don tat ca kho; neu co branch_code (vd trang chu loc theo chi nhanh dang chon o
    BranchSelector) chi tinh tren cac kho CUNG chi nhanh do - ca du lieu lan khoang "binh thuong"
    (IQR) deu rieng theo chi nhanh, tranh bi loang boi quy mo cac chi nhanh khac."""
    where_branch = "WHERE dw.branch_code = :branch_code" if branch_code is not None else ""
    sql = f"""
        SELECT dp.product_id, dp.product_code, dp.product_name, f.movement_type,
               dt.full_date AS d, SUM(f.quantity) AS qty
        FROM fact_stock_movement f
        JOIN dim_product dp ON dp.product_key = f.product_key
        JOIN dim_time dt ON dt.time_key = f.time_key
        JOIN dim_warehouse dw ON dw.warehouse_key = f.warehouse_key
        {where_branch}
        GROUP BY dp.product_id, dp.product_code, dp.product_name, f.movement_type, dt.full_date
    """
    params = {"branch_code": branch_code} if branch_code is not None else {}
    return pd.read_sql(sql_text(sql), engine, params=params)


def _iqr_bounds(values: pd.Series):
    q1 = values.quantile(0.25)
    q3 = values.quantile(0.75)
    iqr = float(q3 - q1)
    low = max(0.0, float(q1 - IQR_FENCE_FACTOR * iqr))
    high = float(q3 + IQR_FENCE_FACTOR * iqr)
    return low, high, iqr


def _severity(value: float, low: float, high: float, iqr: float) -> str:
    if iqr <= 0:
        return "HIGH"
    distance = (value - high) if value > high else (low - value)
    return "HIGH" if (distance / iqr) > SEVERE_IQR_FACTOR else "MEDIUM"


@app.get("/health")
def health():
    return {"status": "ok", "service": "anomaly-detection"}


@app.get("/anomalies")
def anomalies(
    from_date: date = Query(..., alias="from", description="Ngay bat dau (YYYY-MM-DD)"),
    to_date: date = Query(..., alias="to", description="Ngay ket thuc (YYYY-MM-DD)"),
    branchCode: str | None = None,
):
    engine = get_dw_engine()
    df = _daily_movement(engine, branchCode)
    if df.empty:
        return []
    df["d"] = pd.to_datetime(df["d"]).dt.date

    results = []
    for (product_id, movement_type), group in df.groupby(["product_id", "movement_type"]):
        history = group.loc[group["d"] < from_date, "qty"]
        if len(history) < MIN_HISTORY_POINTS:
            continue
        low, high, iqr = _iqr_bounds(history)

        in_range = group[(group["d"] >= from_date) & (group["d"] <= to_date)]
        product_code = group["product_code"].iloc[0]
        product_name = group["product_name"].iloc[0]
        for _, row in in_range.iterrows():
            qty = float(row["qty"])
            if qty < low or qty > high:
                results.append({
                    "date": str(row["d"]),
                    "productId": int(product_id),
                    "productCode": product_code,
                    "productName": product_name,
                    "type": movement_type,
                    "quantity": qty,
                    "expectedRange": [round(low, 2), round(high, 2)],
                    "severity": _severity(qty, low, high, iqr),
                })

    results.sort(key=lambda r: (r["date"], r["productId"]))
    return results
