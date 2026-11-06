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


def handle_revenue_comparison(engine, start, end, label, location=None):
    """So sanh doanh thu ky dang hoi voi ky LIEN TRUOC cung do dai (xem
    entities.previous_period) - tra loi % tang/giam, khong chi 1 con so tong nhu REVENUE_TOTAL."""
    from entities import location_label, previous_period

    prev_start, prev_end = previous_period(start, end)
    loc_sql, loc_params = _location_filter(location)
    params = {"start": start, "end": end, "pstart": prev_start, "pend": prev_end, **loc_params}
    sql = f"""
        SELECT
            COALESCE(SUM(CASE WHEN so_order_date BETWEEN :start AND :end
                               THEN line_amount_after_tax ELSE 0 END), 0) AS cur_rev,
            COALESCE(SUM(CASE WHEN so_order_date BETWEEN :pstart AND :pend
                               THEN line_amount_after_tax ELSE 0 END), 0) AS prev_rev
        FROM fact_sellout WHERE so_order_date BETWEEN :pstart AND :end {loc_sql}
    """
    with engine.connect() as conn:
        cur_rev, prev_rev = conn.execute(sql_text(sql), params).fetchone()

    scope = location_label(location)
    source = [{"start": str(start), "end": str(end), "currentRevenue": float(cur_rev),
               "previousStart": str(prev_start), "previousEnd": str(prev_end),
               "previousRevenue": float(prev_rev)}]

    if cur_rev == 0 and prev_rev == 0:
        return (f"Không có dữ liệu doanh thu{scope} để so sánh giữa {label} ({start} → {end}) "
                f"và kỳ liền trước ({prev_start} → {prev_end})."), source
    if prev_rev == 0:
        answer = (f"Doanh thu{scope} {label} ({start} → {end}): {_money(cur_rev)}.\n"
                  f"Kỳ liền trước ({prev_start} → {prev_end}) chưa có doanh thu nên không tính "
                  f"được % tăng/giảm.")
        return answer, source

    delta = cur_rev - prev_rev
    pct = float(delta) / float(prev_rev) * 100
    trend = "tăng" if delta >= 0 else "giảm"
    answer = (
        f"Doanh thu{scope} {label} ({start} → {end}): {_money(cur_rev)}.\n"
        f"Kỳ liền trước ({prev_start} → {prev_end}): {_money(prev_rev)}.\n"
        f"=> {trend} {abs(pct):.1f}% ({_money(abs(delta))}) so với kỳ liền trước."
    )
    return answer, source


def handle_top_selling(engine, start, end, label, limit=5, location=None):
    from entities import location_label
    loc_sql, loc_params = _location_filter(location)
    sql = f"""
        SELECT product_code, product_name, SUM(quantity) AS qty, SUM(line_amount_after_tax) AS revenue
        FROM fact_sellout WHERE so_order_date BETWEEN :start AND :end {loc_sql}
        GROUP BY product_code, product_name ORDER BY qty DESC LIMIT :limit
    """
    with engine.connect() as conn:
        rows = conn.execute(sql_text(sql), {"start": start, "end": end, "limit": limit, **loc_params}).fetchall()

    scope = location_label(location)
    if not rows:
        return f"Không có dữ liệu bán hàng{scope} trong khoảng {label}.", []

    lines = [f"{i+1}. {r.product_name} ({r.product_code}): {_qty(r.qty)} sản phẩm, doanh thu {_money(r.revenue)}"
             for i, r in enumerate(rows)]
    answer = f"Top {len(rows)} sản phẩm bán chạy nhất{scope} trong {label} ({start} → {end}):\n" + "\n".join(lines)
    return answer, [dict(r._mapping) for r in rows]


def handle_slow_moving(engine, start, end, label, limit=5, location=None):
    from entities import location_label
    loc_sql, loc_params = _location_filter(location, "f.warehouse_code", "f.branch_code")
    sql = f"""
        SELECT dp.product_code, dp.product_name, COALESCE(SUM(f.quantity), 0) AS qty
        FROM dim_product dp
        LEFT JOIN fact_sellout f ON f.product_key = dp.product_key
            AND f.so_order_date BETWEEN :start AND :end {loc_sql}
        GROUP BY dp.product_code, dp.product_name ORDER BY qty ASC LIMIT :limit
    """
    with engine.connect() as conn:
        rows = conn.execute(sql_text(sql), {"start": start, "end": end, "limit": limit, **loc_params}).fetchall()

    scope = location_label(location)
    lines = [f"{i+1}. {r.product_name} ({r.product_code}): chỉ bán {_qty(r.qty)} sản phẩm"
             for i, r in enumerate(rows)]
    answer = (f"{len(rows)} sản phẩm bán chậm nhất{scope} trong {label} ({start} → {end}) "
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


def handle_inbound_summary(engine, start, end, label, location=None):
    from entities import location_label
    loc_sql, loc_params = _location_filter(location, "dw.warehouse_code", "dw.branch_code")
    with engine.connect() as conn:
        summary = conn.execute(sql_text(f"""
            SELECT COALESCE(SUM(f.quantity), 0) AS qty, COALESCE(SUM(f.amount), 0) AS amount, COUNT(*) AS line_count
            FROM fact_inbound f
            JOIN dim_time td ON td.time_key = f.time_key
            JOIN dim_warehouse dw ON dw.warehouse_key = f.warehouse_key
            WHERE td.full_date BETWEEN :start AND :end {loc_sql}
        """), {"start": start, "end": end, **loc_params}).fetchone()

        top_rows = conn.execute(sql_text(f"""
            SELECT dp.product_code, dp.product_name, SUM(f.quantity) AS qty
            FROM fact_inbound f JOIN dim_product dp ON dp.product_key = f.product_key
            JOIN dim_time td ON td.time_key = f.time_key
            JOIN dim_warehouse dw ON dw.warehouse_key = f.warehouse_key
            WHERE td.full_date BETWEEN :start AND :end {loc_sql}
            GROUP BY dp.product_code, dp.product_name ORDER BY qty DESC LIMIT 3
        """), {"start": start, "end": end, **loc_params}).fetchall()

    scope = location_label(location)
    qty, amount, lines_count = summary
    if lines_count == 0:
        return f"Không có dữ liệu nhập hàng{scope} trong khoảng {label} ({start} → {end}).", []

    top_lines = [f"- {r.product_name}: {_qty(r.qty)}" for r in top_rows]
    answer = (f"Nhập hàng{scope} trong {label} ({start} → {end}): tổng {_qty(qty)} sản phẩm, "
              f"giá trị {_money(amount)}, {lines_count} dòng nhập. Nhập nhiều nhất:\n" + "\n".join(top_lines))
    return answer, [{"quantity": float(qty), "amount": float(amount), "lineCount": lines_count}]


def handle_customer_performance(engine, start, end, label, direction="DESC", location=None, limit=5):
    """Xep hang khach hang theo doanh so trong ky, kem LUON tuyen + salesman/supervisor phu
    trach - fact_sellout da denormalize san nen 1 truy van tra loi duoc ca 3 y dinh ma nguoi
    dung thuong hoi gop lai ("KH nao thap nhat, thuoc tuyen nao, SM nao phu trach tuyen do?"),
    khong can tach cau hoi ra tung phan rieng (cac phan sau phu thuoc dai tu "tuyen do" tro ve
    phan truoc nen tach roi se mat ngu canh, khong tu tra loi duoc)."""
    from entities import location_label

    where = ["so_order_date BETWEEN :start AND :end"]
    params = {"start": start, "end": end, "limit": limit}
    loc_sql, loc_params = _location_filter(location)
    params.update(loc_params)

    order = "ASC" if direction == "ASC" else "DESC"
    sql = f"""
        SELECT customer_code, customer_name, route_code, route_name, salesperson_name, supervisor_name,
               SUM(line_amount_after_tax) AS revenue, SUM(quantity) AS qty, COUNT(DISTINCT so_id) AS orders
        FROM fact_sellout WHERE {' AND '.join(where)} {loc_sql}
        GROUP BY customer_code, customer_name, route_code, route_name, salesperson_name, supervisor_name
        ORDER BY revenue {order} LIMIT :limit
    """
    with engine.connect() as conn:
        rows = conn.execute(sql_text(sql), params).fetchall()

    scope = location_label(location)
    if not rows:
        return f"Không có dữ liệu bán hàng{scope} trong khoảng {label}.", []

    rank_label = "thấp nhất" if direction == "ASC" else "cao nhất"
    lines = []
    for i, r in enumerate(rows):
        route = r.route_name or r.route_code or "—"
        sm = r.salesperson_name or "—"
        sup = r.supervisor_name or "—"
        lines.append(
            f'{i+1}. {r.customer_name} ({r.customer_code}): doanh thu {_money(r.revenue)}, '
            f'{_qty(r.qty)} sản phẩm, {r.orders} đơn — thuộc tuyến "{route}", '
            f'SM phụ trách: {sm}, quản lý: {sup}'
        )
    answer = (f"Top {len(rows)} khách hàng có doanh số {rank_label}{scope} trong {label} "
              f"({start} → {end}):\n" + "\n".join(lines))
    return answer, [dict(r._mapping) for r in rows]


def handle_product_by_route(engine, start, end, label, direction="ASC", location=None, limit=25):
    """Khac CUSTOMER_PERFORMANCE/SLOW_MOVING/TOP_SELLING (xep hang CHUNG toan pham vi): o day
    moi TUYEN la 1 nhom rieng, tra ve san pham ban it nhat (hoac nhieu nhat) CUA RIENG tuyen do
    - dung MySQL window function (ROW_NUMBER) de lay dung 1 dong dai dien moi tuyen trong 1
    truy van, khong phai N truy van rieng cho N tuyen."""
    from entities import location_label

    loc_sql, loc_params = _location_filter(location)
    order = "ASC" if direction == "ASC" else "DESC"
    sql = f"""
        SELECT route_code, route_name, product_code, product_name, qty FROM (
            SELECT route_code, route_name, product_code, product_name, SUM(quantity) AS qty,
                   ROW_NUMBER() OVER (PARTITION BY route_code ORDER BY SUM(quantity) {order}) AS rn
            FROM fact_sellout
            WHERE so_order_date BETWEEN :start AND :end {loc_sql} AND route_code IS NOT NULL
            GROUP BY route_code, route_name, product_code, product_name
        ) ranked WHERE rn = 1
        ORDER BY route_code
    """
    params = {"start": start, "end": end, **loc_params}
    with engine.connect() as conn:
        rows = conn.execute(sql_text(sql), params).fetchall()

    scope = location_label(location)
    if not rows:
        return f"Không có dữ liệu bán hàng theo tuyến{scope} trong khoảng {label}.", []

    rank_word = "ít nhất, cần đẩy mạnh" if direction == "ASC" else "nhiều nhất"
    shown = rows[:limit]
    lines = [f'- Tuyến {r.route_name or r.route_code}: "{r.product_name}" ({r.product_code}) '
             f'bán {rank_word} - {_qty(r.qty)} sản phẩm' for r in shown]
    more_note = f"\n… và {len(rows) - limit} tuyến khác." if len(rows) > limit else ""
    answer = (f"Sản phẩm bán {rank_word} theo từng tuyến{scope} trong {label} ({start} → {end}) "
              f"({len(rows)} tuyến):\n" + "\n".join(lines) + more_note)
    return answer, [dict(r._mapping) for r in rows]


def handle_route_count(engine, location=None):
    """Cau hoi DEM so luong ("co bao nhieu tuyen") - tra loi 1-2 dong, KHONG liet ke chi tiet
    tung tuyen (xem handle_product_by_route cho dang liet ke chi tiet). Dung raw_route_master/
    raw_branch (lop Raw/Staging cua DW, sao y nguyen tu OLTP - van la doc tu DW, khong doc thang
    OLTP, dung kien truc da thong nhat)."""
    with engine.connect() as conn:
        rows = conn.execute(sql_text("""
            SELECT b.code, b.name, COUNT(*) AS route_count
            FROM raw_route_master r JOIN raw_branch b ON b.id = r.branch_id
            GROUP BY b.code, b.name ORDER BY b.code
        """)).fetchall()

    if not rows:
        return "Chưa có dữ liệu tuyến bán hàng.", []

    branch_code = location.get("branch_code") if location else None
    if branch_code:
        match = next((r for r in rows if r.code == branch_code), None)
        if not match:
            return f"Không tìm thấy tuyến bán hàng nào thuộc chi nhánh này.", []
        return f"{match.name} hiện có {match.route_count} tuyến bán hàng.", [dict(match._mapping)]

    total = sum(r.route_count for r in rows)
    lines = [f"- {r.name}: {r.route_count} tuyến" for r in rows]
    answer = f"Toàn hệ thống hiện có {total} tuyến bán hàng:\n" + "\n".join(lines)
    return answer, [dict(r._mapping) for r in rows]


def handle_route_salesman_lookup(engine, route):
    """Tra cuu 1 TUYEN CU THE: ai dang phu trach (nhan vien ban hang hien tai, end_date IS NULL)
    + SDT/email. Dung raw_employee/raw_route_salesman_assignment (lop Raw trong DW, moi them vao
    RAW_TABLES - truoc do chatbot khong co du lieu nay)."""
    if not route:
        return ('Bạn cho tôi biết mã tuyến cụ thể (ví dụ "R-HCM-01") để tôi tra cứu nhé.', [])

    sql = """
        SELECT rm.code, rm.name, e.code AS employee_code, e.full_name, e.phone, e.email
        FROM raw_route_master rm
        JOIN raw_route_salesman_assignment rsa ON rsa.route_master_id = rm.id AND rsa.end_date IS NULL
        JOIN raw_employee e ON e.id = rsa.employee_id
        WHERE rm.code = :code
    """
    with engine.connect() as conn:
        row = conn.execute(sql_text(sql), {"code": route["route_code"]}).fetchone()

    if not row:
        return f'Tuyến {route["route_code"]} hiện chưa có nhân viên bán hàng phụ trách.', []

    phone = row.phone or "chưa cập nhật trong hệ thống"
    email = row.email or "chưa cập nhật"
    answer = (f'Tuyến {row.code} ({row.name or "—"}) do {row.full_name} ({row.employee_code}) phụ trách. '
              f"SĐT: {phone}. Email: {email}.")
    return answer, [dict(row._mapping)]


def handle_salesman_performance(engine, start, end, label, direction="ASC", location=None, limit=5):
    """Xep hang NHAN VIEN BAN HANG (khac CUSTOMER_PERFORMANCE - xep hang khach hang) theo tong
    doanh so cac don ho ban trong ky, kem SDT/email (JOIN fact_sellout.salesperson_code ->
    raw_user.username -> raw_employee.user_id, giong cach lay employee cho ROUTE_SALESMAN_LOOKUP)."""
    from entities import location_label

    where = ["f.so_order_date BETWEEN :start AND :end", "f.salesperson_code IS NOT NULL"]
    params = {"start": start, "end": end, "limit": limit}
    loc_sql, loc_params = _location_filter(location, "f.warehouse_code", "f.branch_code")
    params.update(loc_params)

    order = "ASC" if direction == "ASC" else "DESC"
    sql = f"""
        SELECT f.salesperson_code, f.salesperson_name, e.code AS employee_code, e.phone, e.email,
               SUM(f.line_amount_after_tax) AS revenue, SUM(f.quantity) AS qty, COUNT(DISTINCT f.so_id) AS orders
        FROM fact_sellout f
        LEFT JOIN raw_user u ON u.username = f.salesperson_code
        LEFT JOIN raw_employee e ON e.user_id = u.id
        WHERE {' AND '.join(where)} {loc_sql}
        GROUP BY f.salesperson_code, f.salesperson_name, e.code, e.phone, e.email
        ORDER BY revenue {order} LIMIT :limit
    """
    with engine.connect() as conn:
        rows = conn.execute(sql_text(sql), params).fetchall()

    scope = location_label(location)
    if not rows:
        return f"Không có dữ liệu bán hàng theo nhân viên{scope} trong khoảng {label}.", []

    rank_label = "thấp nhất" if direction == "ASC" else "cao nhất"
    lines = []
    for i, r in enumerate(rows):
        phone = r.phone or "chưa cập nhật"
        lines.append(
            f'{i+1}. {r.salesperson_name} ({r.employee_code or r.salesperson_code}): doanh thu {_money(r.revenue)}, '
            f'{_qty(r.qty)} sản phẩm, {r.orders} đơn — SĐT: {phone}'
        )
    answer = (f"Top {len(rows)} nhân viên bán hàng có doanh số {rank_label}{scope} trong {label} "
              f"({start} → {end}):\n" + "\n".join(lines))
    return answer, [dict(r._mapping) for r in rows]


_METRIC_EXPR = {"REVENUE": "SUM(line_amount_after_tax)", "QUANTITY": "SUM(quantity)"}
_METRIC_LABEL = {"REVENUE": "doanh thu", "QUANTITY": "số lượng bán"}
_DIMENSION_LABEL = {
    "PRODUCT": "sản phẩm", "CUSTOMER": "khách hàng", "SALESMAN": "nhân viên bán hàng",
    "SUPERVISOR": "giám sát bán hàng", "ROUTE": "tuyến", "WAREHOUSE": "kho", "BRANCH": "chi nhánh",
    "CATEGORY": "danh mục sản phẩm", "CHANNEL": "kênh bán hàng",
}


def handle_generic_ranking(engine, metric, dimension, start, end, label, direction="DESC", location=None, limit=5):
    """LUOI AN TOAN TONG QUAT - xem entities.py. Tu dong ghep SQL xep hang tren fact_sellout
    theo BAT KY dimension nao trong DIMENSION_COLUMNS, khong can 1 ham rieng cho tung to hop.
    Chi dung khi khong intent cu the nao (TOP_SELLING/CUSTOMER_PERFORMANCE/...) nhan dien duoc -
    cac intent rieng van uu tien hon vi tra loi chi tiet/gop ngu canh phong phu hon (vd
    CUSTOMER_PERFORMANCE con kem ca tuyen + SM phu trach, con o day chi co 1 con so xep hang)."""
    from entities import location_label, DIMENSION_COLUMNS

    code_col, name_col = DIMENSION_COLUMNS[dimension]
    metric_expr = _METRIC_EXPR.get(metric, _METRIC_EXPR["REVENUE"])
    order = "ASC" if direction == "ASC" else "DESC"
    loc_sql, loc_params = _location_filter(location)
    params = {"start": start, "end": end, "limit": limit, **loc_params}

    select_name = f", {name_col} AS dim_name" if name_col else ""
    group_name = f", {name_col}" if name_col else ""
    sql = f"""
        SELECT {code_col} AS dim_code{select_name}, {metric_expr} AS value
        FROM fact_sellout
        WHERE so_order_date BETWEEN :start AND :end {loc_sql} AND {code_col} IS NOT NULL
        GROUP BY {code_col}{group_name}
        ORDER BY value {order} LIMIT :limit
    """
    with engine.connect() as conn:
        rows = conn.execute(sql_text(sql), params).fetchall()

    scope = location_label(location)
    dim_label = _DIMENSION_LABEL.get(dimension, dimension)
    metric_label = _METRIC_LABEL.get(metric, metric)
    if not rows:
        return f"Không có dữ liệu {metric_label} theo {dim_label}{scope} trong khoảng {label}.", []

    rank_word = "thấp nhất" if direction == "ASC" else "cao nhất"
    fmt_value = _money if metric == "REVENUE" else _qty
    lines = [f'{i+1}. {(r.dim_name if name_col else r.dim_code) or r.dim_code} ({r.dim_code}): {fmt_value(r.value)}'
             for i, r in enumerate(rows)]
    answer = (f"Top {len(rows)} {dim_label} có {metric_label} {rank_word}{scope} trong {label} "
              f"({start} → {end}):\n" + "\n".join(lines))
    return answer, [dict(r._mapping) for r in rows]


def handle_supplier_analysis(engine, location=None):
    from entities import location_label
    loc_sql, loc_params = _location_filter(location, "dw.warehouse_code", "dw.branch_code")
    sql = f"""
        SELECT ds.supplier_code, ds.supplier_name, SUM(f.quantity) AS qty, SUM(f.amount) AS amount
        FROM fact_inbound f
        JOIN dim_supplier ds ON ds.supplier_key = f.supplier_key
        JOIN dim_warehouse dw ON dw.warehouse_key = f.warehouse_key
        WHERE 1=1 {loc_sql}
        GROUP BY ds.supplier_code, ds.supplier_name ORDER BY amount DESC
    """
    with engine.connect() as conn:
        rows = conn.execute(sql_text(sql), loc_params).fetchall()

    scope = location_label(location)
    if not rows:
        return f"Chưa có dữ liệu nhập hàng{scope} để phân tích nhà cung cấp.", []

    lines = [f"{i+1}. {r.supplier_name}: nhập {_qty(r.qty)} sản phẩm, giá trị {_money(r.amount)}"
             for i, r in enumerate(rows)]
    note = "" if len(rows) > 1 else "\n(Hiện hệ thống mới có 1 nhà cung cấp.)"
    answer = f"Phân tích nhà cung cấp{scope} (theo tổng giá trị nhập hàng):\n" + "\n".join(lines) + note
    return answer, [dict(r._mapping) for r in rows]
