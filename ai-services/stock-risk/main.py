# AI-02 Stock Risk - ket hop TON KHO HIEN TAI (Data Warehouse) + DU BAO NHU CAU (goi sang
# AI-01 Forecasting qua HTTP) -> xac dinh san pham nguy co het hang + de xuat so luong nhap.
# Tu xay dung logic rule-based tren ket qua cua 2 mo hinh/nguon du lieu that - KHONG goi LLM/API
# ben thu ba nao de "quyet dinh", dung yeu cau GVHD.
#
# Logic rui ro (tu dinh nghia, giai thich duoc - khong phai hop den):
#   - forecastDemand = tong du bao ban ra trong RISK_HORIZON_DAYS ngay toi (goi AI-01).
#   - ratio = currentStock / forecastDemand (ton hien tai du dung duoc may lan nhu cau du bao).
#   - forecastDemand = 0 (khong du bao ban duoc gi)        -> LOW, khong can nhap.
#   - currentStock <= 0 VA forecastDemand > 0               -> HIGH (da het hang, con nhu cau).
#   - ratio < 1.0  (khong du dap ung het ca RISK_HORIZON_DAYS ngay toi) -> HIGH.
#   - 1.0 <= ratio < REORDER_SAFETY_FACTOR                   -> MEDIUM.
#   - ratio >= REORDER_SAFETY_FACTOR                         -> LOW.
#   - suggestedReorderQty = max(0, forecastDemand * REORDER_SAFETY_FACTOR - currentStock) - nhap
#     them du de ton kho dat muc an toan (= du bao * he so an toan), khong nhap am.
# Chay thu: uvicorn main:app --reload --port 8002
import os

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text as sql_text

from db import get_dw_engine

app = FastAPI(title="ERPQLKHO AI Stock Risk", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FORECASTING_URL = os.getenv("FORECASTING_SERVICE_URL", "http://localhost:8001")
RISK_HORIZON_DAYS = 14  # cua so du bao dung de danh gia rui ro (du dai de co thoi gian xu ly nhap hang)
REORDER_SAFETY_FACTOR = 1.5  # muc ton kho an toan = du bao * he so nay


def _current_stock_by_product(engine, warehouse_id: int | None, branch_code: str | None):
    """Ton kho hien tai (snapshot moi nhat trong DW) theo tung san pham. Mac dinh cong don tat
    ca kho; neu co warehouse_id chi lay dung 1 kho do (dropdown chon kho cu the o trang chi
    tiet). Neu co branch_code (trang chu loc theo chi nhanh dang chon o BranchSelector) CHI tinh
    tren kho MAIN cua chi nhanh do, khong cong ca kho VAN/DAMAGE - ton o kho luu dong (VAN) la
    hang dang tren duong giao/da xuat hoa don, khong phai ton "san co the nhap bu" nen cong vao
    se lam loang/che mat rui ro thieu hang that o kho chinh."""
    where_parts = []
    if warehouse_id is not None:
        where_parts.append("dw.warehouse_id = :warehouse_id")
    if branch_code is not None:
        where_parts.append("dw.branch_code = :branch_code")
        where_parts.append("dw.warehouse_type = 'MAIN'")
    where_sql = ("AND " + " AND ".join(where_parts)) if where_parts else ""
    sql = f"""
        SELECT dp.product_id, dp.product_code, dp.product_name,
               COALESCE(SUM(f.quantity_on_hand), 0) AS current_stock
        FROM dim_product dp
        LEFT JOIN fact_inventory_snapshot f ON f.product_key = dp.product_key
            AND f.time_key = (SELECT MAX(time_key) FROM fact_inventory_snapshot)
        LEFT JOIN dim_warehouse dw ON dw.warehouse_key = f.warehouse_key
        WHERE 1=1 {where_sql}
        GROUP BY dp.product_id, dp.product_code, dp.product_name
        ORDER BY dp.product_id
    """
    params = {}
    if warehouse_id is not None:
        params["warehouse_id"] = warehouse_id
    if branch_code is not None:
        params["branch_code"] = branch_code
    with engine.connect() as conn:
        rows = conn.execute(sql_text(sql), params).fetchall()
    return [dict(r._mapping) for r in rows]


async def _forecast_demand(client: httpx.AsyncClient, product_id: int) -> float:
    """Goi sang AI-01 Forecasting, cong don du bao RISK_HORIZON_DAYS ngay toi. Loi ket noi/service
    down -> tra ve None (khong doan bua) de goi noi tu bien rieng, khong lam sap ca request."""
    try:
        resp = await client.post(
            f"{FORECASTING_URL}/forecast",
            json={"productId": product_id, "horizonDays": RISK_HORIZON_DAYS},
            timeout=10.0,
        )
        resp.raise_for_status()
        predictions = resp.json()["predictions"]
        return sum(p["quantity"] for p in predictions)
    except (httpx.HTTPError, KeyError, ValueError):
        return None


def _risk_level(current_stock: float, forecast_demand: float | None) -> str:
    if forecast_demand is None:
        return "UNKNOWN"
    if forecast_demand <= 0:
        return "LOW"
    ratio = current_stock / forecast_demand
    if current_stock <= 0 or ratio < 1.0:
        return "HIGH"
    if ratio < REORDER_SAFETY_FACTOR:
        return "MEDIUM"
    return "LOW"


def _suggested_reorder_qty(current_stock: float, forecast_demand: float | None) -> float:
    if forecast_demand is None or forecast_demand <= 0:
        return 0.0
    target = forecast_demand * REORDER_SAFETY_FACTOR
    return round(max(0.0, target - current_stock), 2)


@app.get("/health")
def health():
    return {"status": "ok", "service": "stock-risk"}


@app.get("/stock-risk")
async def stock_risk(warehouseId: int | None = None, branchCode: str | None = None):
    engine = get_dw_engine()
    products = _current_stock_by_product(engine, warehouseId, branchCode)
    if not products:
        return []

    async with httpx.AsyncClient() as client:
        demands = [await _forecast_demand(client, p["product_id"]) for p in products]

    forecasting_unreachable = all(d is None for d in demands)
    if forecasting_unreachable:
        raise HTTPException(
            503,
            f"Khong goi duoc AI-01 Forecasting ({FORECASTING_URL}) - khong the danh gia rui ro "
            "thieu hang. Kiem tra service Forecasting dang chay chua.",
        )

    result = []
    for p, demand in zip(products, demands):
        current_stock = float(p["current_stock"])
        result.append({
            "productId": p["product_id"],
            "productCode": p["product_code"],
            "productName": p["product_name"],
            "currentStock": current_stock,
            "forecastDemand": round(demand, 2) if demand is not None else None,
            "riskLevel": _risk_level(current_stock, demand),
            "suggestedReorderQty": _suggested_reorder_qty(current_stock, demand),
        })
    return result
