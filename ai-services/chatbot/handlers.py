# AI-04 Chatbot - 1 ham xu ly cho moi Y DINH: query Data Warehouse (khong doc OLTP) + dung
# template tieng Viet de dien so lieu that vao cau tra loi (khong sinh van ban tu do bang mo
# hinh sinh van ban - chi dien du lieu that vao cau co san, de moi con so trong cau tra loi
# deu TRUY XUAT DUOC nguon, khong "bia" nhu LLM sinh tu do).
from datetime import timedelta

from sqlalchemy import text as sql_text


def _money(v):
    return f"{v:,.0f}".replace(",", ".") + " VNĐ" if v is not None else "0 VNĐ"


def _qty(v):
    return f"{v:,.0f}".replace(",", ".") if v is not None else "0"


def _location_filter(location, warehouse_col="warehouse_code", branch_col="branch_code"):
    """Dieu kien SQL + params ung voi 1 dict location (xem entities.extract_location) - dung
    chung cho moi bang co san 2 cot nay (fact_sellout truc tiep, hoac dim_warehouse qua alias)."""
    if not location:
        return "", {}
    if location["scope"] == "warehouse":
        return f" AND {warehouse_col} = :loc_wcode", {"loc_wcode": location["warehouse_code"]}
    if location["scope"] == "branch":
        return f" AND {branch_col} = :loc_bcode", {"loc_bcode": location["branch_code"]}
    return "", {}


def handle_revenue_total(engine, start, end, label, product=None, location=None):
    from entities import location_label

    where = ["so_order_date BETWEEN :start AND :end"]
    params = {"start": start, "end": end}
    if product:
        where.append("product_code = :pcode")
        params["pcode"] = product["product_code"]
    loc_sql, loc_params = _location_filter(location)
    params.update(loc_params)

    sql = f"""
        SELECT COALESCE(SUM(line_amount_after_tax), 0) AS revenue,
               COALESCE(SUM(quantity), 0) AS qty,
               COUNT(DISTINCT so_id) AS order_count
        FROM fact_sellout WHERE {' AND '.join(where)} {loc_sql}
    """
    with engine.connect() as conn:
        row = conn.execute(sql_text(sql), params).fetchone()
    revenue, qty, order_count = row

    scope = f' của "{product["product_name"]}"' if product else ""
    scope += location_label(location)
    answer = (
        f"Doanh thu{scope} trong khoảng {label} ({start} → {end}): {_money(revenue)}, "
        f"từ {order_count} đơn hàng, tổng {_qty(qty)} sản phẩm đã bán."
    )
    if order_count == 0:
        answer = f"Không có dữ liệu bán hàng{scope} trong khoảng {label} ({start} → {end})."
    return answer, [{"start": str(start), "end": str(end), "revenue": float(revenue),
                      "quantity": float(qty), "orderCount": order_count}]


def handle_top_selling(engine, start, end, label, limit=5):
    sql = """
        SELECT product_code, product_name, SUM(quantity) AS qty, SUM(line_amount_after_tax) AS revenue
        FROM fact_sellout WHERE so_order_date BETWEEN :start AND :end
        GROUP BY product_code, product_name ORDER BY qty DESC LIMIT :limit
    """
    with engine.connect() as conn:
        rows = conn.execute(sql_text(sql), {"start": start, "end": end, "limit": limit}).fetchall()

    if not rows:
        return f"Không có dữ liệu bán hàng trong khoảng {label}.", []

    lines = [f"{i+1}. {r.product_name} ({r.product_code}): {_qty(r.qty)} sản phẩm, doanh thu {_money(r.revenue)}"
             for i, r in enumerate(rows)]
    answer = f"Top {len(rows)} sản phẩm bán chạy nhất trong {label} ({start} → {end}):\n" + "\n".join(lines)
    return answer, [dict(r._mapping) for r in rows]


def handle_slow_moving(engine, start, end, label, limit=5):
    sql = """
        SELECT dp.product_code, dp.product_name, COALESCE(SUM(f.quantity), 0) AS qty
        FROM dim_product dp
        LEFT JOIN fact_sellout f ON f.product_key = dp.product_key
            AND f.so_order_date BETWEEN :start AND :end
        GROUP BY dp.product_code, dp.product_name ORDER BY qty ASC LIMIT :limit
    """
    with engine.connect() as conn:
        rows = conn.execute(sql_text(sql), {"start": start, "end": end, "limit": limit}).fetchall()

    lines = [f"{i+1}. {r.product_name} ({r.product_code}): chỉ bán {_qty(r.qty)} sản phẩm"
             for i, r in enumerate(rows)]
    answer = (f"{len(rows)} sản phẩm bán chậm nhất trong {label} ({start} → {end}) "
              f"(0 nghĩa là không bán được sản phẩm nào):\n" + "\n".join(lines))
    return answer, [dict(r._mapping) for r in rows]


def handle_stock_current(engine, product=None, location=None):
    from entities import location_label

    latest_sql = "SELECT MAX(time_key) FROM fact_inventory_snapshot"
    with engine.connect() as conn:
        latest_time_key = conn.execute(sql_text(latest_sql)).scalar()
        if latest_time_key is None:
            return "Chưa có dữ liệu tồn kho trong Data Warehouse.", []

        loc_sql, loc_params = _location_filter(location, "dw.warehouse_code", "dw.branch_code")

        if product:
            sql = f"""
                SELECT dp.product_code, dp.product_name, dw.warehouse_code, dw.warehouse_name,
                       dw.branch_name, f.quantity_on_hand
                FROM fact_inventory_snapshot f
                JOIN dim_product dp ON dp.product_key = f.product_key
                JOIN dim_warehouse dw ON dw.warehouse_key = f.warehouse_key
                WHERE f.time_key = :tk AND dp.product_code = :pcode {loc_sql}
                ORDER BY f.quantity_on_hand DESC
            """
            params = {"tk": latest_time_key, "pcode": product["product_code"], **loc_params}
            rows = conn.execute(sql_text(sql), params).fetchall()
            scope = location_label(location)
            if not rows:
                return f'Không có dữ liệu tồn kho cho "{product["product_name"]}"{scope}.', []
            total = sum(r.quantity_on_hand for r in rows)
            if len(rows) == 1 and location and location["scope"] == "warehouse":
                answer = (f'Tồn kho hiện tại của "{product["product_name"]}" ({product["product_code"]}){scope}: '
                          f"{_qty(total)}")
            else:
                lines = [f"- {r.warehouse_name} ({r.branch_name}): {_qty(r.quantity_on_hand)}" for r in rows]
                answer = (f'Tồn kho hiện tại của "{product["product_name"]}" ({product["product_code"]}){scope}: '
                          f"tổng {_qty(total)}, chi tiết theo kho:\n" + "\n".join(lines))
            return answer, [dict(r._mapping) for r in rows]

        sql = f"""
            SELECT dp.product_code, dp.product_name, SUM(f.quantity_on_hand) AS total_qty
            FROM fact_inventory_snapshot f
            JOIN dim_product dp ON dp.product_key = f.product_key
            JOIN dim_warehouse dw ON dw.warehouse_key = f.warehouse_key
            WHERE f.time_key = :tk {loc_sql}
            GROUP BY dp.product_code, dp.product_name ORDER BY dp.product_name
        """
        rows = conn.execute(sql_text(sql), {"tk": latest_time_key, **loc_params}).fetchall()

    scope = location_label(location) or " (tổng tất cả kho)"
    lines = [f"- {r.product_name} ({r.product_code}): {_qty(r.total_qty)}" for r in rows]
    answer = f"Tồn kho hiện tại theo sản phẩm{scope}:\n" + "\n".join(lines)
    return answer, [dict(r._mapping) for r in rows]


def handle_low_stock(engine, ref_date, location=None, cover_days_threshold=7, limit=10):
    """Tu xay cong thuc canh bao don gian (giong AI-02 Stock Risk): so ngay con du hang =
    ton kho hien tai / toc do ban trung binh/ngay (30 ngay gan nhat). Duoi nguong -> canh bao.
    TINH THEO TUNG KHO RIENG (khong cong don toan quoc) - 1 NVBH o HCM khong the "muon" hang
    tu kho Ha Noi, nen ton kho cao o kho khac khong duoc che lap rui ro thieu hang cuc bo."""
    from entities import location_label

    window_start = ref_date - timedelta(days=29)
    with engine.connect() as conn:
        latest_time_key = conn.execute(sql_text("SELECT MAX(time_key) FROM fact_inventory_snapshot")).scalar()
        if latest_time_key is None:
            return "Chưa có dữ liệu tồn kho để đánh giá.", []

        loc_sql_stock, loc_params_stock = _location_filter(location, "dw.warehouse_code", "dw.branch_code")
        stock_rows = conn.execute(sql_text(f"""
            SELECT dp.product_code, dp.product_name, dw.warehouse_code, dw.warehouse_name, f.quantity_on_hand
            FROM fact_inventory_snapshot f
            JOIN dim_product dp ON dp.product_key = f.product_key
            JOIN dim_warehouse dw ON dw.warehouse_key = f.warehouse_key
            WHERE f.time_key = :tk {loc_sql_stock}
        """), {"tk": latest_time_key, **loc_params_stock}).fetchall()

        loc_sql_sold, loc_params_sold = _location_filter(location)
        sold_rows = conn.execute(sql_text(f"""
            SELECT product_code, warehouse_code, SUM(quantity) AS qty
            FROM fact_sellout WHERE so_order_date BETWEEN :start AND :end {loc_sql_sold}
            GROUP BY product_code, warehouse_code
        """), {"start": window_start, "end": ref_date, **loc_params_sold}).fetchall()

    sold_map = {(r.product_code, r.warehouse_code): float(r.qty) for r in sold_rows}
    results = []
    for r in stock_rows:
        avg_daily = sold_map.get((r.product_code, r.warehouse_code), 0.0) / 30.0
        stock_qty = float(r.quantity_on_hand)
        if stock_qty <= 0 and avg_daily <= 0:
            continue  # kho nay von khong ban/khong giu SP nay - khong phai "sap het hang"
        if stock_qty <= 0:
            days_cover = 0.0
        elif avg_daily <= 0:
            continue  # con hang nhung khong ban ra gan day o kho nay -> khong phai "sap het hang"
        else:
            days_cover = stock_qty / avg_daily
        if stock_qty <= 0 or days_cover < cover_days_threshold:
            results.append({"product_code": r.product_code, "product_name": r.product_name,
                             "warehouse_code": r.warehouse_code, "warehouse_name": r.warehouse_name,
                             "stock_qty": stock_qty, "avg_daily_sales": round(avg_daily, 2),
                             "days_of_cover": round(days_cover, 1)})

    results.sort(key=lambda x: x["days_of_cover"])
    scope = location_label(location)
    if not results:
        return (f"Không có sản phẩm nào sắp hết hàng{scope} (ngưỡng cảnh báo: dưới "
                f"{cover_days_threshold} ngày hàng dự trữ, tính theo tốc độ bán 30 ngày gần nhất)."), []

    shown = results[:limit]
    lines = [f'- {r["product_name"]} ({r["product_code"]}) tại {r["warehouse_name"]}: còn {_qty(r["stock_qty"])}, '
             f'bán ~{r["avg_daily_sales"]}/ngày → đủ dùng ~{r["days_of_cover"]} ngày'
             for r in shown]
    more_note = f"\n… và {len(results) - limit} dòng khác." if len(results) > limit else ""
    answer = (f"{len(results)} cặp sản phẩm × kho sắp hết hàng{scope} (dưới {cover_days_threshold} ngày hàng dự trữ, "
              f"tính riêng theo từng kho, theo tốc độ bán 30 ngày gần nhất tính đến {ref_date}):\n"
              + "\n".join(lines) + more_note)
    return answer, results


def handle_stock_by_warehouse(engine, location=None, product=None):
    from entities import location_label

    with engine.connect() as conn:
        latest_time_key = conn.execute(sql_text("SELECT MAX(time_key) FROM fact_inventory_snapshot")).scalar()
        if latest_time_key is None:
            return "Chưa có dữ liệu tồn kho trong Data Warehouse.", []

        # Hoi dung 1 kho cu the (hoac chi nhanh chi quy ve dung 1 kho) -> liet ke tung san pham
        # trong kho do, giong het STOCK_CURRENT khong co san pham - 2 intent chi khac nhau o
        # cach nguoi dung dien dat cau hoi, du lieu tra ve giong nhau.
        if location and location["scope"] == "warehouse":
            where = ["f.time_key = :tk", "dw.warehouse_code = :wcode"]
            params = {"tk": latest_time_key, "wcode": location["warehouse_code"]}
            if product:
                where.append("dp.product_code = :pcode")
                params["pcode"] = product["product_code"]
            sql = f"""
                SELECT dp.product_code, dp.product_name, f.quantity_on_hand
                FROM fact_inventory_snapshot f JOIN dim_product dp ON dp.product_key = f.product_key
                JOIN dim_warehouse dw ON dw.warehouse_key = f.warehouse_key
                WHERE {' AND '.join(where)}
                ORDER BY f.quantity_on_hand DESC
            """
            rows = conn.execute(sql_text(sql), params).fetchall()
            lines = [f"- {r.product_name} ({r.product_code}): {_qty(r.quantity_on_hand)}" for r in rows]
            answer = f'Tồn kho tại {location["warehouse_name"]}:\n' + "\n".join(lines)
            return answer, [dict(r._mapping) for r in rows]

        # Khong chi dinh kho cu the (khong hoi gi, hoac hoi ca 1 chi nhanh nhieu kho) -> liet ke
        # TUNG KHO rieng trong pham vi do, khong gop chung thanh 1 con so (xem ly do o
        # handle_low_stock - ton kho cac kho khac nhau khong the cong don coi nhu dung 1 cho).
        loc_sql, loc_params = _location_filter(location, "dw.warehouse_code", "dw.branch_code")
        params = {"tk": latest_time_key, **loc_params}
        product_join = ""
        if product:
            product_join = " AND dp.product_code = :pcode"
            params["pcode"] = product["product_code"]
        sql = f"""
            SELECT dw.warehouse_code, dw.warehouse_name, dw.warehouse_type, dw.branch_name,
                   SUM(f.quantity_on_hand) AS total_qty, COUNT(DISTINCT f.product_key) AS product_count
            FROM fact_inventory_snapshot f
            JOIN dim_warehouse dw ON dw.warehouse_key = f.warehouse_key
            JOIN dim_product dp ON dp.product_key = f.product_key
            WHERE f.time_key = :tk {loc_sql} {product_join}
            GROUP BY dw.warehouse_code, dw.warehouse_name, dw.warehouse_type, dw.branch_name
            ORDER BY total_qty DESC
        """
        rows = conn.execute(sql_text(sql), params).fetchall()

    if not rows:
        return f"Không có dữ liệu tồn kho{location_label(location)}.", []

    scope = location_label(location)
    product_note = f' của "{product["product_name"]}"' if product else ""
    lines = [f"- {r.warehouse_name} ({r.branch_name}, loại {r.warehouse_type}): {_qty(r.total_qty)} sản phẩm, "
             f"{r.product_count} mã hàng" for r in rows]
    answer = f"Tồn kho{product_note} theo từng kho{scope}:\n" + "\n".join(lines)
    return answer, [dict(r._mapping) for r in rows]


def handle_inbound_summary(engine, start, end, label):
    with engine.connect() as conn:
        summary = conn.execute(sql_text("""
            SELECT COALESCE(SUM(f.quantity), 0) AS qty, COALESCE(SUM(f.amount), 0) AS amount, COUNT(*) AS line_count
            FROM fact_inbound f JOIN dim_time td ON td.time_key = f.time_key
            WHERE td.full_date BETWEEN :start AND :end
        """), {"start": start, "end": end}).fetchone()

        top_rows = conn.execute(sql_text("""
            SELECT dp.product_code, dp.product_name, SUM(f.quantity) AS qty
            FROM fact_inbound f JOIN dim_product dp ON dp.product_key = f.product_key
            JOIN dim_time td ON td.time_key = f.time_key
            WHERE td.full_date BETWEEN :start AND :end
            GROUP BY dp.product_code, dp.product_name ORDER BY qty DESC LIMIT 3
        """), {"start": start, "end": end}).fetchall()

    qty, amount, lines_count = summary
    if lines_count == 0:
        return f"Không có dữ liệu nhập hàng trong khoảng {label} ({start} → {end}).", []

    top_lines = [f"- {r.product_name}: {_qty(r.qty)}" for r in top_rows]
    answer = (f"Nhập hàng trong {label} ({start} → {end}): tổng {_qty(qty)} sản phẩm, "
              f"giá trị {_money(amount)}, {lines_count} dòng nhập. Nhập nhiều nhất:\n" + "\n".join(top_lines))
    return answer, [{"quantity": float(qty), "amount": float(amount), "lineCount": lines_count}]


def handle_supplier_analysis(engine):
    sql = """
        SELECT ds.supplier_code, ds.supplier_name, SUM(f.quantity) AS qty, SUM(f.amount) AS amount
        FROM fact_inbound f JOIN dim_supplier ds ON ds.supplier_key = f.supplier_key
        GROUP BY ds.supplier_code, ds.supplier_name ORDER BY amount DESC
    """
    with engine.connect() as conn:
        rows = conn.execute(sql_text(sql)).fetchall()

    if not rows:
        return "Chưa có dữ liệu nhập hàng để phân tích nhà cung cấp.", []

    lines = [f"{i+1}. {r.supplier_name}: nhập {_qty(r.qty)} sản phẩm, giá trị {_money(r.amount)}"
             for i, r in enumerate(rows)]
    note = "" if len(rows) > 1 else "\n(Hiện hệ thống mới có 1 nhà cung cấp.)"
    answer = "Phân tích nhà cung cấp (theo tổng giá trị nhập hàng):\n" + "\n".join(lines) + note
    return answer, [dict(r._mapping) for r in rows]
