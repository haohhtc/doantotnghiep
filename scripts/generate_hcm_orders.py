"""Sinh don hang that (SO + DO + INV tuy loai) cho toan bo 480 khach hang co tuyen o chi
nhanh HCM, dung DUNG lich ghe tham da co san (route_master_outlet.monday..sunday) de quyet
dinh ngay nao co the phat sinh don - khop dung nghiep vu Route/Salesman da xay.

Quy tac 3 loai don (dung theo code that cua backend, SalesOrderService.java):
  - PRE_ORDER ("Pre-order"): luon co ca SO + DO + INV.
  - STANDARD  ("Don Van-Sales"): chi co SO + INV (KHONG co DO), source luon = APP (khong
    tao duoc tren web - xem SalesOrder/index.jsx: STANDARD bi disabled tren form web).
  - SAMPLE    ("Don hang mau", mien phi): SO + DO + INV neu source=MANUAL (tao tren web),
    chi SO + INV neu source=APP. Don gia luon = 0.

Cot "source" (MANUAL/APP) tren sales_order/delivery_order/invoice - xem migration V54.

XOA SACH don hang cu cua ca 480 KH HCM (ke ca 20 KH cu) truoc khi sinh lai, de toan bo du
lieu HCM nhat quan 1 kieu (co DO/INV/source day du, khong con don "kieu cu" don gian).
KHONG dong vao HN/DN.

CHAY 1 LAN: cd scripts && python generate_hcm_orders.py
"""
import random
from datetime import date, datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import os

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")
random.seed(31)

ORDER_TYPES = [("PRE_ORDER", 0.60), ("STANDARD", 0.25), ("SAMPLE", 0.15)]
VISIT_ORDER_PROBABILITY = 0.12   # trong 1 ngay ghe tham theo lich, xac suat thuc su co don
RECEIPT_PROBABILITY = 0.5        # xac suat nhap hang bo sung trong 1 ngay (KHO01 xuat nhieu hon truoc)
ANOMALY_COUNT = 3
LOW_STOCK_PRODUCT_COUNT = 5
WEEKDAY_COLS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def env(key, default=None):
    return os.getenv(key, default)


def build_engine():
    user = env("OLTP_DB_USER", "erp_user")
    pwd = env("OLTP_DB_PASSWORD", "erp_password")
    host = env("OLTP_DB_HOST", "localhost")
    port = env("OLTP_DB_PORT", "3306")
    name = env("OLTP_DB_NAME", "erp_qlkho_oltp")
    return create_engine(f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{name}?charset=utf8mb4")


def pick_order_type():
    r = random.random()
    cum = 0.0
    for t, w in ORDER_TYPES:
        cum += w
        if r <= cum:
            return t
    return ORDER_TYPES[-1][0]


def pick_source(order_type):
    if order_type == "STANDARD":
        return "APP"
    if order_type == "SAMPLE":
        return random.choice(["MANUAL", "APP"])
    return random.choices(["MANUAL", "APP"], weights=[0.6, 0.4])[0]


def needs_do(order_type, source):
    if order_type == "PRE_ORDER":
        return True
    if order_type == "STANDARD":
        return False
    return source == "MANUAL"  # SAMPLE


class IdSeq:
    def __init__(self):
        self.counters = {}

    def set_start(self, table, start):
        self.counters[table] = start

    def next(self, table):
        self.counters[table] = self.counters.get(table, 0) + 1
        return self.counters[table]


def main():
    engine = build_engine()
    ids = IdSeq()

    with engine.begin() as conn:
        hcm_branch_id = conn.execute(text("SELECT id FROM branch WHERE code='CN-HCM'")).scalar()
        hcm_wh_id = conn.execute(text("SELECT id FROM warehouse WHERE code='KHO01'")).scalar()
        hcm_van_wh_id = conn.execute(text("SELECT id FROM warehouse WHERE code='KHOVAN01'")).scalar()
        supplier_id = conn.execute(text("SELECT id FROM supplier LIMIT 1")).scalar()
        tax_rate = conn.execute(text("SELECT rate_percent FROM tax_group LIMIT 1")).scalar()

        customers = conn.execute(text(
            "SELECT id FROM customer WHERE branch_id = :b"), {"b": hcm_branch_id}
        ).fetchall()
        customer_ids = [r[0] for r in customers]

        print(f"Xoa don hang cu cua {len(customer_ids)} khach hang HCM...")
        placeholders = ",".join(str(c) for c in customer_ids)
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        conn.execute(text(f"""
            DELETE st FROM stock_transaction st
            WHERE (st.reference_type='SALES_ORDER' AND st.reference_id IN
                   (SELECT id FROM sales_order WHERE customer_id IN ({placeholders})))
               OR (st.reference_type='INVOICE' AND st.reference_id IN
                   (SELECT i.id FROM invoice i JOIN sales_order so ON so.id=i.sales_order_id
                    WHERE so.customer_id IN ({placeholders})))
        """))
        conn.execute(text(f"""
            DELETE ii FROM invoice_item ii
            JOIN invoice i ON i.id = ii.invoice_id
            JOIN sales_order so ON so.id = i.sales_order_id
            WHERE so.customer_id IN ({placeholders})
        """))
        conn.execute(text(f"""
            DELETE i FROM invoice i JOIN sales_order so ON so.id = i.sales_order_id
            WHERE so.customer_id IN ({placeholders})
        """))
        conn.execute(text(f"""
            DELETE doi FROM delivery_order_item doi
            JOIN delivery_order dov ON dov.id = doi.delivery_order_id
            JOIN sales_order so ON so.id = dov.sales_order_id
            WHERE so.customer_id IN ({placeholders})
        """))
        conn.execute(text(f"""
            DELETE dov FROM delivery_order dov JOIN sales_order so ON so.id = dov.sales_order_id
            WHERE so.customer_id IN ({placeholders})
        """))
        conn.execute(text(f"DELETE sod FROM sales_order_detail sod JOIN sales_order so ON so.id=sod.sales_order_id "
                           f"WHERE so.customer_id IN ({placeholders})"))
        conn.execute(text(f"DELETE FROM sales_order WHERE customer_id IN ({placeholders})"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))

        products = conn.execute(text("SELECT id, code FROM product")).fetchall()
        products = [{"id": r[0], "code": r[1]} for r in products]
        ranks = list(range(1, len(products) + 1))
        random.shuffle(ranks)
        product_weights = [1.0 / r for r in ranks]

        # Gia theo tung KH: lay dung bang gia khach hang dang gan (customer.price_list_id),
        # giong het logic PriceListService.lookupPrice() ben backend (purpose='SALE').
        customer_price_list = dict(conn.execute(text(
            "SELECT id, price_list_id FROM customer WHERE id IN ({})".format(placeholders)
        )).fetchall())
        price_map = {}  # {price_list_id: {product_id: {"price":.., "uom_id":..}}}
        for pl_id, pid, uid, price in conn.execute(text("""
            SELECT pli.price_list_id, pli.product_id, pli.uom_id, pli.price
            FROM price_list_item pli
            JOIN price_list pl ON pl.id = pli.price_list_id AND pl.type = 'SALE'
        """)).fetchall():
            price_map.setdefault(pl_id, {})[pid] = {"price": float(price), "uom_id": uid}

        def price_for(customer_id, product_id):
            pl_id = customer_price_list.get(customer_id)
            return (price_map.get(pl_id) or {}).get(product_id)

        # Gia mua (dung cho goods_receipt_detail uoc tinh) - lay bang gia PURCHASE dang active.
        purchase_price = {}
        for pid, price in conn.execute(text("""
            SELECT pli.product_id, pli.price FROM price_list_item pli
            JOIN price_list pl ON pl.id = pli.price_list_id AND pl.type = 'PURCHASE' AND pl.is_active = 1
        """)).fetchall():
            purchase_price[pid] = float(price)

        route_salesman = {}
        for cust_id, route_id, salesman_uid in conn.execute(text("""
            SELECT rmo.customer_id, rmo.route_master_id, e.user_id
            FROM route_master_outlet rmo
            JOIN route_salesman_assignment rsa ON rsa.route_master_id = rmo.route_master_id AND rsa.end_date IS NULL
            JOIN employee e ON e.id = rsa.employee_id
            WHERE rmo.customer_id IN ({})
        """.format(placeholders))).fetchall():
            route_salesman[cust_id] = (route_id, salesman_uid)

        visit_schedule = {}
        for row in conn.execute(text(f"""
            SELECT customer_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday
            FROM route_master_outlet WHERE customer_id IN ({placeholders})
        """)).fetchall():
            cust_id = row[0]
            visit_schedule[cust_id] = {i for i, v in enumerate(row[1:]) if v}

        stock = {}
        for pid, qty in conn.execute(text(
            "SELECT product_id, quantity FROM stock WHERE warehouse_id = :w"), {"w": hcm_wh_id}
        ).fetchall():
            stock[pid] = float(qty)

        max_so = conn.execute(text("SELECT MAX(id) FROM sales_order")).scalar() or 0
        max_sod = conn.execute(text("SELECT MAX(id) FROM sales_order_detail")).scalar() or 0
        max_do = conn.execute(text("SELECT MAX(id) FROM delivery_order")).scalar() or 0
        max_doi = conn.execute(text("SELECT MAX(id) FROM delivery_order_item")).scalar() or 0
        max_inv = conn.execute(text("SELECT MAX(id) FROM invoice")).scalar() or 0
        max_invi = conn.execute(text("SELECT MAX(id) FROM invoice_item")).scalar() or 0
        max_stx = conn.execute(text("SELECT MAX(id) FROM stock_transaction")).scalar() or 0
        max_gr = conn.execute(text("SELECT MAX(id) FROM goods_receipt")).scalar() or 0
        max_grd = conn.execute(text("SELECT MAX(id) FROM goods_receipt_detail")).scalar() or 0
        for t, v in [("sales_order", max_so), ("sales_order_detail", max_sod), ("delivery_order", max_do),
                     ("delivery_order_item", max_doi), ("invoice", max_inv), ("invoice_item", max_invi),
                     ("stock_transaction", max_stx), ("goods_receipt", max_gr), ("goods_receipt_detail", max_grd)]:
            ids.set_start(t, v)

        so_seq = conn.execute(text("SELECT current_sequence FROM numbering_config WHERE doc_type='SALES_ORDER'")).scalar() or 0
        do_seq = conn.execute(text("SELECT current_sequence FROM numbering_config WHERE doc_type='DELIVERY_ORDER'")).scalar() or 0
        inv_seq = conn.execute(text("SELECT current_sequence FROM numbering_config WHERE doc_type='INVOICE'")).scalar() or 0

        start_date, end_date = conn.execute(text(
            "SELECT MIN(doc_date), MAX(doc_date) FROM sales_order"
        )).fetchone()
        if start_date is None:
            start_date, end_date = date.today() - timedelta(days=180), date.today()

        print(f"Khoang ngay: {start_date} -> {end_date}. Dang sinh don hang...")

        n_so = n_do = n_inv = 0
        current = start_date
        while current <= end_date:
            day_dt = datetime.combine(current, datetime.min.time()).replace(hour=9)
            weekday = current.weekday()

            if random.random() < RECEIPT_PROBABILITY:
                max_gr = ids.next("goods_receipt")
                conn.execute(text("""
                    INSERT INTO goods_receipt (id, doc_number, doc_date, posting_date, supplier_id,
                                                warehouse_id, status, created_by, created_at)
                    VALUES (:id, :doc, :d, :d, :s, :w, 'CLOSED', 2, :dt)
                """), {"id": max_gr, "doc": f"GR{max_gr:06d}", "d": current, "s": supplier_id,
                        "w": hcm_wh_id, "dt": day_dt})
                for p in random.sample(products, k=min(5, len(products))):
                    base_price = purchase_price.get(p["id"]) or 10000.0
                    qty = round(random.uniform(80, 400), 0)
                    unit_price = base_price * random.uniform(0.9, 1.1)
                    conn.execute(text("""
                        INSERT INTO goods_receipt_detail (id, goods_receipt_id, product_id, quantity, unit_price, amount)
                        VALUES (:id, :gr, :p, :q, :up, :amt)
                    """), {"id": ids.next("goods_receipt_detail"), "gr": max_gr, "p": p["id"], "q": qty,
                            "up": round(unit_price, 2), "amt": round(qty * unit_price, 2)})
                    stock[p["id"]] = stock.get(p["id"], 0) + qty
                    conn.execute(text("""
                        INSERT INTO stock_transaction (id, product_id, warehouse_id, type, quantity,
                                                         reference_type, reference_id, created_at)
                        VALUES (:id, :p, :w, 'IN', :q, 'GOODS_RECEIPT', :ref, :dt)
                    """), {"id": ids.next("stock_transaction"), "p": p["id"], "w": hcm_wh_id, "q": qty,
                            "ref": max_gr, "dt": day_dt})

            for cust_id in customer_ids:
                sched = visit_schedule.get(cust_id)
                if not sched or weekday not in sched:
                    continue
                if random.random() > VISIT_ORDER_PROBABILITY:
                    continue
                route_id, salesman_uid = route_salesman.get(cust_id, (None, None))
                if not salesman_uid:
                    continue

                order_type = pick_order_type()
                source = pick_source(order_type)
                is_sample = order_type == "SAMPLE"

                chosen = random.choices(products, weights=product_weights, k=random.randint(1, 4))
                lines = []
                for p in {pp["id"]: pp for pp in chosen}.values():
                    priced = price_for(cust_id, p["id"])
                    if not priced:
                        continue
                    qty = round(random.uniform(1, 10), 0)
                    avail = stock.get(p["id"], 0)
                    qty = min(qty, avail)
                    if qty <= 0:
                        continue
                    unit_price = 0.0 if is_sample else priced["price"]
                    amount = round(qty * unit_price, 2)
                    lines.append({"product": p, "qty": qty, "unit_price": unit_price, "amount": amount,
                                   "uom_id": priced["uom_id"]})
                if not lines:
                    continue

                so_seq += 1
                so_id = ids.next("sales_order")
                total_amount = round(sum(l["amount"] for l in lines), 2)
                conn.execute(text("""
                    INSERT INTO sales_order (id, doc_number, doc_date, customer_id, warehouse_id, status,
                                              order_type, total_amount, created_by, confirmed_by,
                                              route_master_id, salesman_id, source, created_at)
                    VALUES (:id, :doc, :d, :c, :w, 'CONFIRMED', :ot, :amt, :sm, :sm, :r, :sm, :src, :dt)
                """), {"id": so_id, "doc": f"SO{so_seq:06d}", "d": current, "c": cust_id, "w": hcm_wh_id,
                        "ot": order_type, "amt": total_amount, "sm": salesman_uid, "r": route_id,
                        "src": source, "dt": day_dt})
                for l in lines:
                    conn.execute(text("""
                        INSERT INTO sales_order_detail (id, sales_order_id, product_id, quantity, unit_price, amount)
                        VALUES (:id, :so, :p, :q, :up, :amt)
                    """), {"id": ids.next("sales_order_detail"), "so": so_id, "p": l["product"]["id"],
                            "q": l["qty"], "up": l["unit_price"], "amt": l["amount"]})
                n_so += 1

                do_id = None
                if needs_do(order_type, source):
                    do_seq += 1
                    do_id = ids.next("delivery_order")
                    do_date = current + timedelta(days=random.randint(0, 2))
                    conn.execute(text("""
                        INSERT INTO delivery_order (id, doc_number, doc_date, sales_order_id, warehouse_id,
                                                      status, created_by, confirmed_by, van_warehouse_id, source, created_at)
                        VALUES (:id, :doc, :d, :so, :w, 'CLOSED', :sm, :sm, :van, 'MANUAL', :dt)
                    """), {"id": do_id, "doc": f"DO{do_seq:06d}", "d": do_date, "so": so_id, "w": hcm_wh_id,
                            "sm": salesman_uid, "van": hcm_van_wh_id,
                            "dt": datetime.combine(do_date, datetime.min.time()).replace(hour=10)})
                    for l in lines:
                        conn.execute(text("""
                            INSERT INTO delivery_order_item (id, delivery_order_id, product_id, quantity, base_quantity, uom_id)
                            VALUES (:id, :do, :p, :q, :q, :u)
                        """), {"id": ids.next("delivery_order_item"), "do": do_id, "p": l["product"]["id"],
                                "q": l["qty"], "u": l["uom_id"]})
                    n_do += 1
                    inv_date = do_date + timedelta(days=random.randint(0, 1))
                else:
                    inv_date = current + timedelta(days=random.randint(0, 1))

                inv_seq += 1
                inv_id = ids.next("invoice")
                subtotal = round(sum(l["amount"] for l in lines), 2)
                tax_amt = round(subtotal * float(tax_rate) / 100, 2)
                conn.execute(text("""
                    INSERT INTO invoice (id, invoice_number, invoice_date, sales_order_id, delivery_order_id,
                                          subtotal_amount, tax_amount, total_amount, created_by, status, source, created_at)
                    VALUES (:id, :doc, :d, :so, :do, :sub, :tax, :tot, :sm, 'ACTIVE', :src, :dt)
                """), {"id": inv_id, "doc": f"HD{inv_seq:06d}", "d": inv_date, "so": so_id, "do": do_id,
                        "sub": subtotal, "tax": tax_amt, "tot": subtotal + tax_amt, "sm": salesman_uid,
                        "src": source, "dt": datetime.combine(inv_date, datetime.min.time()).replace(hour=14)})
                for l in lines:
                    line_tax = round(l["amount"] * float(tax_rate) / 100, 2)
                    conn.execute(text("""
                        INSERT INTO invoice_item (id, invoice_id, product_id, quantity, unit_price, tax_rate,
                                                    line_tax_amount, line_total, uom_id, base_quantity)
                        VALUES (:id, :inv, :p, :q, :up, :tr, :lt, :ltot, :u, :q)
                    """), {"id": ids.next("invoice_item"), "inv": inv_id, "p": l["product"]["id"], "q": l["qty"],
                            "up": l["unit_price"], "tr": tax_rate, "lt": line_tax,
                            "ltot": l["amount"] + line_tax, "u": l["uom_id"]})
                    stock[l["product"]["id"]] = stock.get(l["product"]["id"], 0) - l["qty"]
                    conn.execute(text("""
                        INSERT INTO stock_transaction (id, product_id, warehouse_id, type, quantity,
                                                         reference_type, reference_id, created_at)
                        VALUES (:id, :p, :w, 'OUT', :q, 'INVOICE', :ref, :dt)
                    """), {"id": ids.next("stock_transaction"), "p": l["product"]["id"], "w": hcm_wh_id,
                            "q": l["qty"], "ref": inv_id,
                            "dt": datetime.combine(inv_date, datetime.min.time()).replace(hour=14)})
                n_inv += 1

            current += timedelta(days=1)

        # Cay bat thuong + ep ton thap (giu dung y tuong AI Anomaly/Stock Risk nhu ban goc)
        for _ in range(ANOMALY_COUNT):
            p = random.choice(products)
            spike_date = end_date - timedelta(days=random.randint(5, 45))
            spike_qty = round(random.uniform(300, 600), 0)
            stock[p["id"]] = stock.get(p["id"], 0) + spike_qty
            conn.execute(text("""
                INSERT INTO stock_transaction (id, product_id, warehouse_id, type, quantity,
                                                 reference_type, reference_id, created_at)
                VALUES (:id, :p, :w, 'IN', :q, 'SEED_ADJUSTMENT', 0, :dt)
            """), {"id": ids.next("stock_transaction"), "p": p["id"], "w": hcm_wh_id, "q": spike_qty,
                    "dt": datetime.combine(spike_date, datetime.min.time())})
            stock[p["id"]] -= spike_qty
            conn.execute(text("""
                INSERT INTO stock_transaction (id, product_id, warehouse_id, type, quantity,
                                                 reference_type, reference_id, created_at)
                VALUES (:id, :p, :w, 'OUT', :q, 'SEED_ADJUSTMENT', 0, :dt)
            """), {"id": ids.next("stock_transaction"), "p": p["id"], "w": hcm_wh_id, "q": spike_qty,
                    "dt": datetime.combine(spike_date, datetime.min.time()).replace(hour=15)})
            print(f"  [anomaly] {spike_date} SP={p['code']} kho=KHO01 xuat dot bien {spike_qty}")

        low_targets = random.sample(products, k=min(LOW_STOCK_PRODUCT_COUNT, len(products)))
        for p in low_targets:
            current_qty = stock.get(p["id"], 0)
            if current_qty > 5:
                drain = current_qty - random.uniform(0, 5)
                stock[p["id"]] -= drain
                conn.execute(text("""
                    INSERT INTO stock_transaction (id, product_id, warehouse_id, type, quantity,
                                                     reference_type, reference_id, created_at)
                    VALUES (:id, :p, :w, 'ADJUST', :q, 'SEED_ADJUSTMENT', 0, :dt)
                """), {"id": ids.next("stock_transaction"), "p": p["id"], "w": hcm_wh_id, "q": -drain,
                        "dt": datetime.combine(end_date, datetime.min.time())})
            existing_alert = conn.execute(text(
                "SELECT id FROM stock_alert WHERE product_id=:p AND warehouse_id=:w"
            ), {"p": p["id"], "w": hcm_wh_id}).scalar()
            if not existing_alert:
                conn.execute(text("""
                    INSERT INTO stock_alert (product_id, warehouse_id, min_quantity, status)
                    VALUES (:p, :w, :m, 'ACTIVE')
                """), {"p": p["id"], "w": hcm_wh_id, "m": round(stock.get(p["id"], 0) + random.uniform(15, 30), 0)})
            print(f"  [low-stock] SP={p['code']} kho=KHO01 con {stock.get(p['id'], 0):.0f}")

        for pid, qty in stock.items():
            conn.execute(text("""
                UPDATE stock SET quantity = :q WHERE product_id = :p AND warehouse_id = :w
            """), {"q": max(0, qty), "p": pid, "w": hcm_wh_id})

        for doc_type, seq in [("SALES_ORDER", so_seq), ("DELIVERY_ORDER", do_seq), ("INVOICE", inv_seq)]:
            conn.execute(text("UPDATE numbering_config SET current_sequence=:s WHERE doc_type=:t"),
                         {"s": seq, "t": doc_type})

    print(f"\nDa sinh: {n_so} don hang ban, {n_do} don giao hang, {n_inv} hoa don (480 khach HCM).")
    print("Tiep theo: chay 'python ../etl/run_etl.py' de dong bo vao Data Warehouse.")


if __name__ == "__main__":
    main()
