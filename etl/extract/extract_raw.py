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


def extract_sellout(engine):
    """1 dong = 1 sales_order_detail CONFIRMED, da gop san moi thong tin can cho fact_sellout
    (san pham, khach hang, chi nhanh, tuyen/salesman, giao hang, hoa don) - doc tu raw_*."""
    sql = """
        SELECT
            so.id                                           AS so_id,
            sod.id                                           AS so_detail_id,
            so.doc_number                                    AS so_order_number,
            so.doc_date                                      AS so_order_date,
            YEAR(so.doc_date)                                AS so_order_year,
            MONTH(so.doc_date)                               AS so_order_month,
            so.status                                        AS so_order_status,
            CASE so.status
                WHEN 'PENDING'   THEN 'Cho duyet'
                WHEN 'CONFIRMED' THEN 'Da xac nhan'
                WHEN 'CANCELLED' THEN 'Da huy'
                ELSE so.status
            END                                               AS so_order_status_vn,
            CASE so.status
                WHEN 'PENDING'   THEN 'choduyet'
                WHEN 'CONFIRMED' THEN 'daxacnhan'
                WHEN 'CANCELLED' THEN 'dahuy'
                ELSE 'khac'
            END                                               AS sos_order_status_icon_vn,
            'Ban hang'                                        AS sos_order_type_vn,
            'SALES ORDER'                                     AS source_type,

            p.code                                            AS product_code,
            p.name                                            AS product_name,
            COALESCE(u_sale.code, u_sod.code)                 AS product_uom_code,
            pc.code                                           AS category_code,
            pc.name                                           AS category_name,
            pc_parent.code                                    AS parent_category_code,
            pc_parent.name                                    AS parent_category_name,
            pg_sub.group_code                                 AS product_group_code,
            pg_sub.group_name                                 AS product_group_name,

            c.code                                            AS customer_code,
            c.name                                             AS customer_name,
            c.address                                          AS customer_address,
            pr.name                                            AS customer_province,
            dt.name                                            AS customer_district,
            w.name                                             AS customer_ward,
            cc.code                                            AS customer_channel_code,
            cc.name                                            AS customer_channel_name,
            cg_sub.group_code                                  AS customer_group_code,
            cg_sub.group_name                                  AS customer_group_name,

            b.code                                             AS branch_code,
            b.name                                             AS branch_name,

            reg.name                                           AS region_name,
            sz.name                                            AS selling_zone_name,
            b.name                                             AS branch_territory_name,
            rm.code                                            AS route_code,
            rm.name                                            AS route_name,
            rm.selling_category                                AS selling_category_code,

            sal.username                                       AS salesperson_code,
            sal.full_name                                      AS salesperson_name,
            sup.username                                       AS supervisor_code,
            sup.full_name                                      AS supervisor_name,

            wh.code                                            AS warehouse_code,

            sod.quantity                                       AS quantity,
            sod.unit_price                                     AS unit_price,
            sod.amount                                         AS line_amount,
            COALESCE(tg.rate_percent, 0)                       AS tax_rate,
            ROUND(sod.amount * COALESCE(tg.rate_percent, 0) / 100, 2) AS tax_amount,
            sod.amount + ROUND(sod.amount * COALESCE(tg.rate_percent, 0) / 100, 2) AS line_amount_after_tax,
            0.00                                                AS discount_amount,
            sod.amount                                         AS line_amount_before_discount,

            inv.invoice_number,
            inv.invoice_date,
            ii.line_total                                      AS invoice_line_total,

            dov.doc_number                                     AS delivery_number,
            dov.doc_date                                       AS delivery_date,
            doi.quantity                                       AS delivery_quantity

        FROM raw_sales_order_detail   sod
        JOIN  raw_sales_order         so   ON sod.sales_order_id  = so.id
        JOIN  raw_product             p    ON sod.product_id      = p.id
        JOIN  raw_product_category    pc   ON p.category_id       = pc.id
        LEFT JOIN raw_product_category pc_parent ON pc.parent_id  = pc_parent.id
        LEFT JOIN raw_uom              u_sale ON p.sale_uom_id    = u_sale.id
        LEFT JOIN raw_uom              u_sod  ON sod.uom_id       = u_sod.id
        LEFT JOIN raw_tax_group        tg     ON p.sale_tax_group_id = tg.id
        LEFT JOIN (
            SELECT pgi.product_id, pg.code AS group_code, pg.name AS group_name
            FROM raw_product_group_item pgi
            JOIN raw_product_group pg ON pgi.product_group_id = pg.id
        ) pg_sub ON pg_sub.product_id = p.id
        JOIN  raw_customer             c   ON so.customer_id      = c.id
        LEFT JOIN raw_province         pr  ON c.province_id       = pr.id
        LEFT JOIN raw_district         dt  ON c.district_id       = dt.id
        LEFT JOIN raw_ward             w   ON c.ward_id           = w.id
        LEFT JOIN raw_customer_channel cc  ON c.channel_id        = cc.id
        LEFT JOIN (
            SELECT cgm.customer_id, cg.code AS group_code, cg.name AS group_name
            FROM raw_customer_group_member cgm
            JOIN raw_customer_group cg ON cgm.customer_group_id = cg.id
        ) cg_sub ON cg_sub.customer_id = c.id
        LEFT JOIN raw_branch           b   ON c.branch_id         = b.id
        LEFT JOIN raw_user             sal ON so.salesman_id       = sal.id
        LEFT JOIN raw_route_master     rm  ON so.route_master_id  = rm.id
        LEFT JOIN raw_selling_zone     sz  ON rm.selling_zone_id  = sz.id
        LEFT JOIN raw_region           reg ON sz.region_id        = reg.id
        LEFT JOIN raw_user             sup ON rm.manage_by_id     = sup.id
        JOIN  raw_warehouse            wh  ON so.warehouse_id     = wh.id
        LEFT JOIN raw_invoice          inv ON inv.sales_order_id  = so.id
        LEFT JOIN raw_invoice_item     ii  ON ii.invoice_id       = inv.id
                                           AND ii.product_id      = sod.product_id
        LEFT JOIN raw_delivery_order   dov ON dov.sales_order_id  = so.id
        LEFT JOIN raw_delivery_order_item doi ON doi.delivery_order_id = dov.id
                                              AND doi.product_id  = sod.product_id
        WHERE so.status = 'CONFIRMED'
    """
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
