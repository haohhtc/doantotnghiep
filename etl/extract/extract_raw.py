"""Doc du lieu cho buoc Transform tu lop Raw/Staging trong DW (bang raw_*), khong con
truy van truc tiep OLTP nua - dung engine = get_dw_engine(), khong phai get_oltp_engine().
Cung cau truc cau SQL nhu etl/extract/extract_oltp.py, chi doi ten bang sang raw_*."""
import pandas as pd


def extract_products(engine):
    sql = """
        SELECT p.id AS product_id, p.code AS product_code, p.name AS product_name,
               c.name AS category_name,
               su.code AS uom_code, su.name AS unit,
               stg.rate_percent AS tax_rate
        FROM raw_product p
        JOIN raw_product_category c ON c.id = p.category_id
        LEFT JOIN raw_uom su ON su.id = p.sale_uom_id
        LEFT JOIN raw_tax_group stg ON stg.id = p.sale_tax_group_id
    """
    return pd.read_sql(sql, engine)


def extract_suppliers(engine):
    sql = "SELECT id AS supplier_id, code AS supplier_code, name AS supplier_name FROM raw_supplier"
    return pd.read_sql(sql, engine)


def extract_warehouses(engine):
    sql = """
        SELECT w.id AS warehouse_id, w.code AS warehouse_code, w.name AS warehouse_name, w.warehouse_type,
               b.code AS branch_code, b.name AS branch_name
        FROM raw_warehouse w
        LEFT JOIN raw_branch b ON b.id = w.branch_id
    """
    return pd.read_sql(sql, engine)


def extract_customers(engine):
    sql = """
        SELECT c.id AS customer_id, c.code AS customer_code, c.name AS customer_name,
               ch.code AS channel_code, ch.name AS channel_name,
               r.name AS region_name, p.name AS province_name, w.name AS ward_name
        FROM raw_customer c
        LEFT JOIN raw_customer_channel ch ON ch.id = c.channel_id
        LEFT JOIN raw_ward w ON w.id = c.ward_id
        LEFT JOIN raw_district d ON d.id = w.district_id
        LEFT JOIN raw_province p ON p.id = d.province_id
        LEFT JOIN raw_region r ON r.id = p.region_id
    """
    return pd.read_sql(sql, engine)


def extract_goods_receipts(engine):
    sql = """
        SELECT gr.id AS goods_receipt_id, gr.doc_date, gr.supplier_id, gr.warehouse_id,
               d.product_id, d.quantity, d.unit_price, d.amount
        FROM raw_goods_receipt gr
        JOIN raw_goods_receipt_detail d ON d.goods_receipt_id = gr.id
        WHERE gr.status = 'CLOSED'
    """
    return pd.read_sql(sql, engine)


def extract_sales_orders(engine):
    sql = """
        SELECT so.id AS sales_order_id, so.doc_date, so.customer_id, so.warehouse_id,
               d.product_id, d.quantity, d.unit_price, d.amount
        FROM raw_sales_order so
        JOIN raw_sales_order_detail d ON d.sales_order_id = so.id
        WHERE so.status = 'CONFIRMED'
    """
    return pd.read_sql(sql, engine)


def extract_stock_transactions(engine):
    sql = """
        SELECT id AS transaction_id, product_id, warehouse_id, type AS movement_type,
               quantity, reference_type, reference_id, created_at
        FROM raw_stock_transaction
    """
    return pd.read_sql(sql, engine)


def extract_stock_snapshot(engine):
    sql = "SELECT product_id, warehouse_id, quantity AS quantity_on_hand FROM raw_stock"
    return pd.read_sql(sql, engine)


if __name__ == "__main__":
    import sys
    from pathlib import Path

    sys.path.append(str(Path(__file__).resolve().parent.parent))
    from config.db_config import get_dw_engine

    dw = get_dw_engine()
    products = extract_products(dw)
    print(products.head())
    print(f"\n{len(products)} san pham (doc tu raw_product trong DW)")
