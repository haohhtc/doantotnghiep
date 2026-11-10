"""
Report Data API - port 8005
Cung cap du lieu tong hop tu DW cho Frontend bao cao.
Chay: uvicorn main:app --reload --port 8005
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pymysql
import pymysql.cursors

app = FastAPI(title="Report Data API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

DW_CONFIG = dict(
    host="localhost", port=3307,
    user="erp_user", password="erp_password",
    database="erp_qlkho_dw",
    charset="utf8mb4",
    init_command="SET NAMES 'utf8mb4' COLLATE 'utf8mb4_0900_ai_ci'",
    cursorclass=pymysql.cursors.DictCursor,
)


from decimal import Decimal
import datetime

def _fix_encoding(v):
    """MySQL DWH server tra ve latin1 bytes du lieu utf8mb4 → giai ma lai."""
    try:
        return v.encode('latin-1').decode('utf-8')
    except (UnicodeDecodeError, UnicodeEncodeError):
        return v

def _to_json(row):
    result = {}
    for k, v in row.items():
        if isinstance(v, Decimal):
            result[k] = float(v)
        elif isinstance(v, str):
            result[k] = _fix_encoding(v)
        elif isinstance(v, (datetime.date, datetime.datetime)):
            result[k] = v.isoformat()
        else:
            result[k] = v
    return result

def query(sql, params=None):
    conn = pymysql.connect(**DW_CONFIG)
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return [_to_json(r) for r in cur.fetchall()]
    finally:
        conn.close()


# BC BAN HANG
@app.get("/reports/sales")
def sales_report():
    monthly = query("""
        SELECT so_order_year AS nam, so_order_month AS thang,
               SUM(line_amount_after_tax) AS doanh_so,
               SUM(quantity) AS so_luong,
               COUNT(DISTINCT so_order_number) AS so_don
        FROM fact_sellout
        WHERE sos_order_type_vn != 'Tra hang'
        GROUP BY so_order_year, so_order_month
        ORDER BY so_order_year, so_order_month
    """)

    top_products = query("""
        SELECT product_name, product_code,
               SUM(line_amount_after_tax) AS doanh_so,
               SUM(quantity) AS so_luong
        FROM fact_sellout
        WHERE sos_order_type_vn != 'Tra hang'
        GROUP BY product_code, product_name
        ORDER BY doanh_so DESC LIMIT 10
    """)

    stages = query("""
        SELECT order_stage, COUNT(DISTINCT so_order_number) AS so_don
        FROM fact_sellout
        GROUP BY order_stage
        ORDER BY order_stage
    """)

    top_customers = query("""
        SELECT customer_name, customer_code,
               SUM(line_amount_after_tax) AS doanh_so,
               COUNT(DISTINCT so_order_number) AS so_don
        FROM fact_sellout
        WHERE sos_order_type_vn != 'Tra hang' AND customer_name IS NOT NULL
        GROUP BY customer_code, customer_name
        ORDER BY doanh_so DESC LIMIT 10
    """)

    summary = query("""
        SELECT
            SUM(CASE WHEN sos_order_type_vn != 'Tra hang' THEN line_amount_after_tax ELSE 0 END) AS tong_doanh_so,
            COUNT(DISTINCT CASE WHEN sos_order_type_vn != 'Tra hang' THEN so_order_number END) AS tong_don,
            SUM(CASE WHEN sos_order_type_vn != 'Tra hang' THEN quantity ELSE 0 END) AS tong_sl,
            SUM(CASE WHEN sos_order_type_vn = 'Tra hang' THEN line_amount_after_tax ELSE 0 END) AS tong_tra_hang
        FROM fact_sellout
    """)

    return {
        "monthly": [dict(r) for r in monthly],
        "top_products": [dict(r) for r in top_products],
        "stages": [dict(r) for r in stages],
        "top_customers": [dict(r) for r in top_customers],
        "summary": dict(summary[0]) if summary else {},
    }


# BC KHO
@app.get("/reports/inventory")
def inventory_report():
    current_stock = query("""
        SELECT product_code, product_name, category_name,
               warehouse_code, warehouse_name, warehouse_type, branch_name,
               quantity_on_hand, avg_unit_price, inventory_value, stock_status
        FROM fact_tonkho
        ORDER BY inventory_value DESC
    """)

    by_category = query("""
        SELECT category_name,
               SUM(quantity_on_hand) AS tong_ton,
               SUM(inventory_value) AS gia_tri
        FROM fact_tonkho
        GROUP BY category_name
        ORDER BY gia_tri DESC
    """)

    by_warehouse = query("""
        SELECT warehouse_name, warehouse_type,
               SUM(quantity_on_hand) AS tong_ton,
               SUM(inventory_value) AS gia_tri
        FROM fact_tonkho
        GROUP BY warehouse_name, warehouse_type
        ORDER BY gia_tri DESC
    """)

    monthly_movement = query("""
        SELECT txn_year AS nam, txn_month AS thang, txn_type_vn AS loai,
               SUM(ABS(quantity)) AS so_luong
        FROM fact_tonkho_movement
        GROUP BY txn_year, txn_month, txn_type_vn
        ORDER BY txn_year, txn_month, txn_type_vn
    """)

    stock_status_dist = query("""
        SELECT stock_status, COUNT(*) AS so_sku
        FROM fact_tonkho
        GROUP BY stock_status
    """)

    summary = query("""
        SELECT
            COUNT(DISTINCT product_code) AS so_sku,
            SUM(quantity_on_hand) AS tong_ton,
            SUM(inventory_value) AS tong_gia_tri,
            SUM(CASE WHEN stock_status IN ('Ton thap','Ton thap') THEN 1 ELSE 0 END) AS sku_ton_thap,
            SUM(CASE WHEN stock_status IN ('Het hang','Het hang') THEN 1 ELSE 0 END) AS sku_het_hang
        FROM fact_tonkho
    """)

    return {
        "current_stock": [dict(r) for r in current_stock],
        "by_category": [dict(r) for r in by_category],
        "by_warehouse": [dict(r) for r in by_warehouse],
        "monthly_movement": [dict(r) for r in monthly_movement],
        "stock_status_dist": [dict(r) for r in stock_status_dist],
        "summary": dict(summary[0]) if summary else {},
    }


# BC BAN HANG - JOIN dim_customer + raw_branch/region de fill NULL columns
@app.get("/reports/sellout")
def sellout_report():
    rows = query("""
        SELECT
            fs.so_order_number, fs.so_order_date, fs.so_order_year, fs.so_order_month,
            fs.sos_order_type_vn, fs.so_order_status_vn, fs.order_stage,
            fs.branch_code, fs.branch_name,
            COALESCE(fs.region_name, rr.name)         AS region_name,
            fs.selling_zone_name,
            fs.route_code, fs.route_name,
            fs.salesperson_code, fs.salesperson_name, fs.supervisor_name,
            fs.customer_code, fs.customer_name,
            COALESCE(fs.customer_province, dc.province_name) AS customer_province,
            COALESCE(fs.customer_district, dc.district_name) AS customer_district,
            COALESCE(fs.customer_ward,     dc.ward_name)     AS customer_ward,
            fs.customer_channel_name,
            fs.product_code, fs.product_name, fs.product_uom_code,
            fs.category_name, fs.parent_category_name,
            fs.quantity, fs.unit_price,
            fs.line_amount_before_discount, fs.discount_amount, fs.line_amount,
            fs.tax_rate, fs.tax_amount, fs.line_amount_after_tax,
            fs.so_link_number, fs.invoice_number
        FROM fact_sellout fs
        LEFT JOIN dim_customer  dc ON fs.customer_code = dc.customer_code
        LEFT JOIN raw_branch    rb ON fs.branch_code   = rb.code
        LEFT JOIN raw_region    rr ON rb.region_id     = rr.id
        ORDER BY
            (fs.selling_zone_name IS NULL),
            fs.so_order_date DESC
    """)
    return {"rows": rows, "count": len(rows)}


# BC KHO - Ton kho hien tai
@app.get("/reports/tonkho")
def tonkho_detail():
    rows = query("""
        SELECT
            snapshot_date, product_code, product_name,
            category_name, parent_category_name,
            warehouse_code, warehouse_name, warehouse_type, branch_name,
            quantity_on_hand, avg_unit_price, inventory_value, stock_status
        FROM fact_tonkho
        ORDER BY branch_name, warehouse_name, product_name
    """)
    return {"rows": rows, "count": len(rows)}


# BC KHO - Bien dong kho (Nhap/Xuat/Chuyen)
@app.get("/reports/tonkho-movement")
def tonkho_movement():
    rows = query("""
        SELECT
            txn_date, txn_type_vn, reference_type_vn,
            product_code, product_name, category_name,
            warehouse_code, warehouse_name, warehouse_type, branch_name,
            quantity
        FROM fact_tonkho_movement
        ORDER BY txn_date DESC
    """)
    return {"rows": rows, "count": len(rows)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
