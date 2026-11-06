# AI-01 Forecasting - du bao nhu cau san pham 7/14/30 ngay toi.
# Tu xay dung bang statsmodels (Holt-Winters / Exponential Smoothing) tren DU LIEU LICH SU THAT
# trong Data Warehouse (fact_sellout) - KHONG goi LLM/API cua ben thu ba nao, dung yeu cau cua
# GVHD la phai tu lam phan AI (giong cach chatbot tu xay dung bang scikit-learn - xem
# ai-services/chatbot/nlp.py).
#
# Phuong phap: Holt-Winters (trend + mua vu theo NGAY TRONG TUAN, seasonal_periods=7) - hop ly vi
# ban hang kenh phan phoi thuong co chu ky tuan (NVBH di tuyen co dinh theo thu trong tuan, xem
# route_salesman_assignment). Du lieu ban hang THUA (khong phai ngay nao cung co don, trung binh
# chi ~35% so ngay trong lich su co phat sinh don) nen:
#   - Chuoi thoi gian duoc dap day ve tan so NGAY (ngay khong co don = 0, khong bo trong).
#   - Neu qua it lich su (< 2 chu ky tuan) hoac Holt-Winters khong hoi tu (hay gap voi chuoi
#     nhieu so 0) -> fallback ve trung binh truot 28 ngay gan nhat nhan he so mua vu theo thu
#     trong tuan (tu tinh tu lich su, khong phai tham so co dinh).
# Chay thu: uvicorn main:app --reload --port 8001
import warnings
from datetime import date, timedelta

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import text as sql_text
from statsmodels.tsa.holtwinters import ExponentialSmoothing

from db import get_dw_engine

app = FastAPI(title="ERPQLKHO AI Forecasting", version="1.0")

# Goi truc tiep tu Frontend/Stock-Risk service (khac origin) - xem docs/05-api-contract/api-endpoints.md.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# So ngay lich su toi thieu de thu Holt-Winters theo mua vu tuan (>= 2 chu ky de uoc luong duoc
# thanh phan mua vu) - it hon se chac chan fallback ve trung binh truot.
MIN_HISTORY_DAYS = 14
SEASONAL_PERIOD = 7
MOVING_AVG_WINDOW = 28


class ForecastRequest(BaseModel):
    productId: int
    horizonDays: int = Field(default=7, gt=0, le=90)


def _daily_series(engine, product_code: str) -> pd.Series:
    """Tong so luong ban THEO NGAY cua 1 san pham, dap day ca ngay khong co don (=0) de co chuoi
    thoi gian lien tuc - bat buoc cho Holt-Winters (khong chap nhan chuoi bi thieu ngay)."""
    sql = """
        SELECT so_order_date AS d, SUM(quantity) AS qty
        FROM fact_sellout WHERE product_code = :pc
        GROUP BY so_order_date ORDER BY d
    """
    df = pd.read_sql(sql_text(sql), engine, params={"pc": product_code})
    if df.empty:
        return pd.Series(dtype=float)
    df["d"] = pd.to_datetime(df["d"])
    s = df.set_index("d")["qty"].astype(float)
    full_idx = pd.date_range(s.index.min(), s.index.max(), freq="D")
    return s.reindex(full_idx, fill_value=0.0)


def _weekday_factor(series: pd.Series) -> dict:
    """He so mua vu theo thu trong tuan (0=Thu Hai..6=Chu Nhat) = trung binh ngay do / trung binh
    chung - tu tinh tu CHINH lich su cua san pham, khong phai tham so co dinh ap dat."""
    overall = series.mean()
    if not overall:
        return {}
    by_dow = series.groupby(series.index.dayofweek).mean()
    return {int(k): float(v / overall) for k, v in by_dow.items()}


def _moving_average_forecast(series: pd.Series, horizon: int) -> np.ndarray:
    """Fallback khi qua it lich su hoac Holt-Winters khong hoi tu: trung binh truot
    MOVING_AVG_WINDOW ngay gan nhat, dieu chinh theo he so mua vu thu trong tuan."""
    if len(series) == 0:
        return np.zeros(horizon)
    base = float(series.tail(MOVING_AVG_WINDOW).mean())
    dow_factor = _weekday_factor(series)
    last_date = series.index[-1]
    preds = []
    for i in range(1, horizon + 1):
        d = last_date + pd.Timedelta(days=i)
        factor = dow_factor.get(int(d.dayofweek), 1.0)
        preds.append(max(base * factor, 0.0))
    return np.array(preds)


def _forecast_series(series: pd.Series, horizon: int) -> np.ndarray:
    """Tra ve mang [horizon] gia tri du bao (khong am, da lam tron o tang goi API)."""
    if len(series) < MIN_HISTORY_DAYS or series.sum() == 0:
        return _moving_average_forecast(series, horizon)

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = ExponentialSmoothing(
                series,
                trend="add",
                seasonal="add",
                seasonal_periods=SEASONAL_PERIOD,
                initialization_method="estimated",
            ).fit(optimized=True)
            preds = model.forecast(horizon)
        result = np.clip(preds.to_numpy(), 0, None)
        if not np.isfinite(result).all():
            raise ValueError("Holt-Winters tra ve gia tri khong hop le (NaN/inf)")
        return result
    except Exception:
        # Chuoi qua thua/nhieu so 0 lam Holt-Winters khong hoi tu duoc (hay gap thuc te) -
        # fallback ve trung binh truot thay vi loi 500.
        return _moving_average_forecast(series, horizon)


@app.get("/health")
def health():
    return {"status": "ok", "service": "forecasting"}


@app.post("/forecast")
def forecast(req: ForecastRequest):
    engine = get_dw_engine()
    with engine.connect() as conn:
        row = conn.execute(
            sql_text("SELECT product_code FROM dim_product WHERE product_id = :pid"),
            {"pid": req.productId},
        ).fetchone()
    if not row:
        raise HTTPException(404, f"Khong tim thay san pham id={req.productId} trong Data Warehouse")
    product_code = row[0]

    series = _daily_series(engine, product_code)
    preds = _forecast_series(series, req.horizonDays)

    last_date = series.index[-1].date() if len(series) else date.today()
    predictions = [
        {"date": str(last_date + timedelta(days=i + 1)), "quantity": round(float(q), 2)}
        for i, q in enumerate(preds)
    ]
    return {"productId": req.productId, "predictions": predictions}
