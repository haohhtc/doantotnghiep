"""
Sinh du lieu mau lich su (N thang) cho CSDL OLTP (erp_qlkho_oltp) de Backend/ETL/BI/AI co
data thuc te de demo - khong phai "vai dong test" khong co pattern gi.

Danh muc san pham la hang Orion that (Chocopie, Custas, Solite, Cosy, Swing, O'Star,
Marine Boy, Toonies), moi san pham co UOM rieng theo dung quy cach dong goi thuc te
(vd: Chocopie = Cai -> Hop(12) -> Thung(12 hop); snack dang goi = Goi -> Thung truc tiep,
khong co cap Hop trung gian).

YEU CAU TRUOC KHI CHAY:
  - Da chay Flyway (mvn spring-boot:run 1 lan) toi it nhat V16 (branch/uom/price_list/
    customer_channel...) de cac bang da ton tai.
  - .env o thu muc goc project da co OLTP_DB_* dung (xem .env.example).

CACH CHAY:
  cd scripts
  pip install -r requirements.txt
  python generate_sample_data.py --months 6
  python generate_sample_data.py --months 6 --force   # xoa data seed cu, sinh lai tu dau

Y TUONG MO PHONG (khong random thuan tuy):
  - Moi san pham co 1 "do pho bien" khac nhau (kieu Pareto) -> vai SP ban chay, nhieu SP it ban.
  - Có xu huong tang nhe theo thoi gian + ban chay hon vao cuoi tuan.
  - Co gia 2-3 diem BAT THUONG that ro (xuat kho tang dot bien) -> Anomaly Detection co gi de bat.
  - Cuoi giai doan, vai san pham bi ep ton kho xuong thap + tao stock_alert -> Stock Risk co du lieu.

PHAM VI (chua lam trong lan nay - de danh cho buoc sau):
  - Chua sinh du lieu branch/selling_zone/route_master/route_setting/route_master_outlet.
  - Chua gan channel_id/group_id cho customer (van la khach hang ca nhan chung chung).
"""

import argparse
import random
from datetime import date, datetime, timedelta

import numpy as np
from dotenv import load_dotenv
from pathlib import Path
import os
from sqlalchemy import create_engine, MetaData, delete, select, text

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

# ============================================================================
# CAU HINH
# ============================================================================
NUM_WAREHOUSES = 3
NUM_CUSTOMERS = 40
DAILY_ORDERS_RANGE = (5, 20)       # so don ban / ngay
RECEIPT_PROBABILITY = 0.35         # xac suat 1 kho nhap hang trong 1 ngay
ANOMALY_COUNT = 3                  # so diem bat thuong co tinh cay
LOW_STOCK_PRODUCT_COUNT = 5        # so san pham bi ep ve ton thap cuoi giai doan
SEED_USER_PREFIX = "seed_"

# ============================================================================
# DANH MUC SAN PHAM ORION THAT
# ============================================================================
# (code, name, parent_code) - parent_code=None la danh muc goc
ORION_CATEGORIES = [
    ("BANHKEO", "Banh keo", None),
    ("SNACK", "Snack", None),
    ("CHOCOPIE", "Chocopie", "BANHKEO"),
    ("CUSTAS", "Custas", "BANHKEO"),
    ("SOLITE", "Solite - Banh bong lan", "BANHKEO"),
    ("COSY", "Cosy", "BANHKEO"),
    ("SWING", "Swing", "BANHKEO"),
    ("OSTAR", "O'Star", "SNACK"),
    ("MARINEBOY", "Marine Boy", "SNACK"),
    ("TOONIES", "Toonies", "SNACK"),
]

# uom_group_code -> (ma+ten don vi goc, [(ma don vi, ten, so luong don vi goc trong 1 don vi nay), ...])
# Hang dong goi tung Cai (Chocopie/Custas/Solite): Cai -> Hop -> Thung (3 cap).
# Hang dong goi tung Goi (Cosy/Swing/O'Star/Marine Boy/Toonies): Goi -> Thung thang (2 cap,
# dung thuc te - khong co "hop" trung gian cho snack dang goi rieng le).
ORION_UOM_GROUPS = {
    "UG_CHOCOPIE": ("CAI", "Cai", [("HOP", "Hop", 12), ("THUNG", "Thung", 144)]),
    "UG_CUSTAS":   ("CAI", "Cai", [("HOP", "Hop", 6), ("THUNG", "Thung", 144)]),
    "UG_SOLITE":   ("CAI", "Cai", [("HOP", "Hop", 6), ("THUNG", "Thung", 72)]),
    "UG_COSY":     ("GOI", "Goi", [("THUNG", "Thung", 24)]),
    "UG_SWING":    ("GOI", "Goi", [("THUNG", "Thung", 24)]),
    "UG_OSTAR":    ("GOI", "Goi", [("THUNG", "Thung", 40)]),
    "UG_MARINEBOY": ("GOI", "Goi", [("THUNG", "Thung", 40)]),
    "UG_TOONIES":  ("GOI", "Goi", [("THUNG", "Thung", 50)]),
}

# (ma SP, ten SP, ma danh muc, ma uom_group, gia ban theo don vi goc)
ORION_PRODUCTS = [
    ("CP001", "Banh Chocopie hop 12 cai 468g", "CHOCOPIE", "UG_CHOCOPIE", 3750),
    ("CP002", "Banh Chocopie Dark hop 12 cai 456g", "CHOCOPIE", "UG_CHOCOPIE", 4000),
    ("CT001", "Banh Custas hop 6 cai 297g", "CUSTAS", "UG_CUSTAS", 5833),
    ("CT002", "Banh Custas Choco hop 6 cai 318g", "CUSTAS", "UG_CUSTAS", 6000),
    ("SL001", "Banh bong lan cao cap kieu Au Opera vi Socola hop 6 cai", "SOLITE", "UG_SOLITE", 8000),
    ("SL002", "Banh bong lan cao cap kieu Au Opera vi Vani hop 6 cai", "SOLITE", "UG_SOLITE", 8000),
    ("CS001", "Banh quy Cosy Marie 300g", "COSY", "UG_COSY", 18000),
    ("CS002", "Banh quy Cosy Kem Sua 200g", "COSY", "UG_COSY", 15000),
    ("SW001", "Keo Swing Chocolate 168g", "SWING", "UG_SWING", 22000),
    ("OS001", "Snack O'Star vi tom cay 40g", "OSTAR", "UG_OSTAR", 7000),
    ("OS002", "Snack O'Star vi bo nuong 40g", "OSTAR", "UG_OSTAR", 7000),
    ("MB001", "Snack Marine Boy vi muc 40g", "MARINEBOY", "UG_MARINEBOY", 6500),
    ("TN001", "Toonies pho mai que 30g", "TOONIES", "UG_TOONIES", 6000),
]

TAX_GROUP_DEF = ("VAT8", "VAT 8%", 8.00)

SUPPLIER_DEF = {
    "code": "NCC01", "name": "Cong ty TNHH Thuc Pham Orion Vina", "foreign_name": "Orion Vina Co., Ltd",
    "contact_person": "Phong Kinh doanh", "phone": "02838123456", "email": "kinhdoanh@orionvina-mau.vn",
    "address": "Khu Cong nghiep My Phuoc, Binh Duong", "active": True,
}

SURNAMES = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Huynh", "Vo", "Dang", "Bui", "Do"]
MIDDLE_NAMES = ["Van", "Thi", "Minh", "Duc", "Ngoc", "Thanh", "Huu", "Thu"]
GIVEN_NAMES = ["An", "Binh", "Chau", "Dung", "Giang", "Hoa", "Khang", "Lan", "Nam", "Phuc", "Quyen", "Trang"]
STREETS = ["Le Loi", "Nguyen Trai", "Cach Mang Thang 8", "Vo Van Tan", "Ly Thuong Kiet", "Hai Ba Trung"]
DISTRICTS = ["Quan 1", "Quan 3", "Quan 7", "Quan Tan Binh", "Quan Binh Thanh", "TP Thu Duc"]
WAREHOUSE_DEFS = [
    ("KHO01", "Kho Tong TP.HCM", "MAIN"),
    ("KHO02", "Kho Tong Ha Noi", "MAIN"),
    ("KHOVAN01", "Kho Luu Dong 01", "VAN"),
]

random.seed(42)
np.random.seed(42)


def env(key, default=None):
    return os.getenv(key, default)


def build_engine():
    user = env("OLTP_DB_USER", "erp_user")
    pwd = env("OLTP_DB_PASSWORD", "erp_password")
    host = env("OLTP_DB_HOST", "localhost")
    port = env("OLTP_DB_PORT", "3306")
    name = env("OLTP_DB_NAME", "erp_qlkho_oltp")
    url = f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{name}?charset=utf8mb4"
    return create_engine(url)


class IdSeq:
    """Cap phat ID tang dan tu 1 cho tung bang - dung khi bang dang RONG."""

    def __init__(self):
        self.counters = {}

    def next(self, table_name):
        self.counters[table_name] = self.counters.get(table_name, 0) + 1
        return self.counters[table_name]


ids = IdSeq()


# ============================================================================
# BUOC 1: MASTER DATA (danh muc)
# ============================================================================
def build_uom_and_tax():
    """UOM goc (Cai/Goi/Hop/Thung) dung chung, moi dong san pham co 1 uom_group rieng
    vi he so quy doi khac nhau (VD Chocopie 12 cai/hop, Custas 6 cai/hop)."""
    uom_master = [("CAI", "Cai"), ("GOI", "Goi"), ("HOP", "Hop"), ("THUNG", "Thung")]
    uoms = []
    uom_id_by_code = {}
    for code, name in uom_master:
        uid = ids.next("uom")
        uoms.append({"id": uid, "code": code, "name": name})
        uom_id_by_code[code] = uid

    uom_groups = []
    uom_conversions = []
    group_id_by_code = {}
    for gcode, (base_code, base_name, extra) in ORION_UOM_GROUPS.items():
        gid = ids.next("uom_group")
        uom_groups.append({"id": gid, "code": gcode, "name": f"Quy doi {gcode.replace('UG_', '').title()}",
                            "base_uom_id": uom_id_by_code[base_code]})
        group_id_by_code[gcode] = gid
        uom_conversions.append({"id": ids.next("uom_conversion"), "uom_group_id": gid,
                                 "uom_id": uom_id_by_code[base_code], "factor": 1})
        for ucode, uname, factor in extra:
            uom_conversions.append({"id": ids.next("uom_conversion"), "uom_group_id": gid,
                                     "uom_id": uom_id_by_code[ucode], "factor": factor})

    tax_code, tax_name, tax_rate = TAX_GROUP_DEF
    tax_groups = [{"id": ids.next("tax_group"), "code": tax_code, "name": tax_name, "rate_percent": tax_rate}]

    return uoms, uom_id_by_code, uom_groups, group_id_by_code, uom_conversions, tax_groups


def build_price_list(products, uom_conversions):
    """1 bang gia Standard - moi don vi (Cai/Hop/Thung...) cua 1 SP co 1 dong gia = gia goc x he so quy doi."""
    conv_by_group = {}
    for c in uom_conversions:
        conv_by_group.setdefault(c["uom_group_id"], []).append((c["uom_id"], c["factor"]))

    pl_id = ids.next("price_list")
    price_lists = [{
        "id": pl_id, "code": "BG-CHUAN-2026", "name": "Bang gia chuan 2026", "type": "STANDARD",
        "start_date": date.today() - timedelta(days=210), "end_date": None, "is_active": True,
    }]
    price_list_items = []
    for p in products:
        for uom_id, factor in conv_by_group.get(p["uom_group_id"], []):
            price_list_items.append({
                "id": ids.next("price_list_item"), "price_list_id": pl_id, "product_id": p["id"],
                "uom_id": uom_id, "price": round(p["price"] * factor, 2),
            })
    return price_lists, price_list_items


def build_master_data():
    categories = []
    cat_id_by_code = {}
    for code, name, parent_code in ORION_CATEGORIES:
        cid = ids.next("product_category")
        categories.append({"id": cid, "code": code, "name": name, "parent_id": cat_id_by_code.get(parent_code)})
        cat_id_by_code[code] = cid

    uoms, uom_id_by_code, uom_groups, group_id_by_code, uom_conversions, tax_groups = build_uom_and_tax()
    tax_id = tax_groups[0]["id"]

    products = []
    for code, name, cat_code, ug_code, price in ORION_PRODUCTS:
        base_uom_code, base_uom_name, _ = ORION_UOM_GROUPS[ug_code]
        base_uom_id = uom_id_by_code[base_uom_code]
        products.append({
            "id": ids.next("product"), "code": code, "name": name, "foreign_name": None,
            "category_id": cat_id_by_code[cat_code], "description": None, "active": True,
            "uom_group_id": group_id_by_code[ug_code],
            # product khong co 1 cot UOM/thue duy nhat nua (V19 tach 3 tab Purchase/Sale/Inventory) -
            # dung chung 1 don vi goc + 1 nhom thue cho ca 3 tab, don gian hoa cho du an.
            "purchase_uom_id": base_uom_id, "sale_uom_id": base_uom_id, "inventory_uom_id": base_uom_id,
            "purchase_tax_group_id": tax_id, "sale_tax_group_id": tax_id, "inventory_tax_group_id": tax_id,
            # 2 key duoi day KHONG con la cot that cua bang product (da bi xoa o V19) - chi giu lai
            # de cac ham khac trong file nay (gia don hang, bang gia) dung noi bo; se bi loc bo tu
            # dong truoc khi INSERT (xem _rows_for_table trong main()).
            "unit": base_uom_name, "price": price,
        })
    ranks = list(range(1, len(products) + 1))
    random.shuffle(ranks)
    product_weights = [1.0 / r for r in ranks]

    suppliers = [{"id": ids.next("supplier"), **SUPPLIER_DEF}]

    warehouses = []
    for code, name, wtype in WAREHOUSE_DEFS[:NUM_WAREHOUSES]:
        warehouses.append({
            "id": ids.next("warehouse"), "code": code, "name": name, "address": f"{random.choice(STREETS)}, {random.choice(DISTRICTS)}",
            "warehouse_type": wtype, "manager_id": None, "active": True,
        })

    customers = []
    for i in range(1, NUM_CUSTOMERS + 1):
        full_name = f"{random.choice(SURNAMES)} {random.choice(MIDDLE_NAMES)} {random.choice(GIVEN_NAMES)}"
        customers.append({
            "id": ids.next("customer"), "code": f"KH{i:04d}", "name": full_name,
            "phone": f"09{random.randint(10000000, 99999999)}",
            "email": f"khachhang{i}@example-mau.vn",
            "address": f"{random.randint(1,300)} {random.choice(STREETS)}, {random.choice(DISTRICTS)}",
            "active": True,
        })

    price_lists, price_list_items = build_price_list(products, uom_conversions)

    return {
        "categories": categories, "products": products, "product_weights": product_weights,
        "suppliers": suppliers, "warehouses": warehouses, "customers": customers,
        "uoms": uoms, "uom_groups": uom_groups, "uom_conversions": uom_conversions,
        "tax_groups": tax_groups, "price_lists": price_lists, "price_list_items": price_list_items,
    }


def build_seed_users(role_id, count=3):
    users = []
    for i in range(1, count + 1):
        users.append({
            "id": ids.next("user"),
            "username": f"{SEED_USER_PREFIX}staff{i:02d}",
            "password": "SEED_DATA_NOT_A_REAL_PASSWORD",
            "full_name": f"{random.choice(SURNAMES)} {random.choice(MIDDLE_NAMES)} {random.choice(GIVEN_NAMES)}",
            "email": f"staff{i}@example-mau.vn",
            "role_id": role_id,
            "status": "ACTIVE",
        })
    return users


# ============================================================================
# BUOC 2: GIAO DICH THEO NGAY (nhap hang / ban hang / kiem ke)
# ============================================================================
def generate_transactions(months, products, product_weights, suppliers, warehouses, customers, user_ids):
    end_date = date.today()
    start_date = end_date - timedelta(days=months * 30)

    stock = {}  # (product_id, warehouse_id) -> quantity hien tai (trong bo nho, cap nhat dan)
    for p in products:
        for w in warehouses:
            stock[(p["id"], w["id"])] = 0.0

    goods_receipts, goods_receipt_details = [], []
    sales_orders, sales_order_details = [], []
    stock_transactions = []
    stock_takes, stock_take_details = [], []

    def add_stock_txn(product_id, warehouse_id, txn_type, qty, ref_type, ref_id, when):
        stock_transactions.append({
            "id": ids.next("stock_transaction"), "product_id": product_id, "warehouse_id": warehouse_id,
            "type": txn_type, "quantity": qty, "reference_type": ref_type, "reference_id": ref_id,
            "created_at": when,
        })

    current = start_date
    while current <= end_date:
        day_dt = datetime.combine(current, datetime.min.time()).replace(hour=9)

        # --- Nhap hang: moi kho, xac suat nhap trong ngay ---
        for w in warehouses:
            if random.random() < RECEIPT_PROBABILITY:
                supplier = random.choice(suppliers)
                gr_id = ids.next("goods_receipt")
                goods_receipts.append({
                    "id": gr_id, "doc_number": f"GR{gr_id:06d}", "doc_date": current, "posting_date": current,
                    "supplier_id": supplier["id"], "warehouse_id": w["id"], "status": "CLOSED", "remarks": None,
                    "created_by": random.choice(user_ids), "created_at": day_dt,
                })
                for p in random.sample(products, k=min(5, len(products))):
                    qty = round(random.uniform(50, 300), 0)
                    unit_price = p["price"] * random.uniform(0.6, 0.8)  # gia nhap re hon gia ban
                    goods_receipt_details.append({
                        "id": ids.next("goods_receipt_detail"), "goods_receipt_id": gr_id, "product_id": p["id"],
                        "quantity": qty, "unit_price": round(unit_price, 2), "amount": round(qty * unit_price, 2),
                    })
                    stock[(p["id"], w["id"])] += qty
                    add_stock_txn(p["id"], w["id"], "IN", qty, "GOODS_RECEIPT", gr_id, day_dt)

        # --- Ban hang: nhieu don/ngay, cuoi tuan ban chay hon ---
        weekday_boost = 1.3 if current.weekday() >= 5 else 1.0
        trend_boost = 1.0 + 0.3 * ((current - start_date).days / max(1, (end_date - start_date).days))
        num_orders = int(random.randint(*DAILY_ORDERS_RANGE) * weekday_boost * trend_boost)

        for _ in range(num_orders):
            w = random.choice(warehouses)
            customer = random.choice(customers)
            chosen_products = random.choices(products, weights=product_weights, k=random.randint(1, 4))
            lines = []
            for p in set(pp["id"] for pp in chosen_products):
                product = next(pp for pp in chosen_products if pp["id"] == p)
                desired = round(random.uniform(1, 20), 0)
                available = stock[(p, w["id"])]
                qty = min(desired, available)
                if qty <= 0:
                    continue
                lines.append((product, qty))

            if not lines:
                continue

            so_id = ids.next("sales_order")
            total = 0.0
            for product, qty in lines:
                unit_price = product["price"]
                amount = round(qty * unit_price, 2)
                total += amount
                sales_order_details.append({
                    "id": ids.next("sales_order_detail"), "sales_order_id": so_id, "product_id": product["id"],
                    "quantity": qty, "unit_price": unit_price, "amount": amount,
                })
                stock[(product["id"], w["id"])] -= qty
                add_stock_txn(product["id"], w["id"], "OUT", qty, "SALES_ORDER", so_id, day_dt)

            sales_orders.append({
                "id": so_id, "doc_number": f"SO{so_id:06d}", "doc_date": current, "customer_id": customer["id"],
                "warehouse_id": w["id"], "status": "CONFIRMED", "total_amount": round(total, 2),
                "created_by": random.choice(user_ids), "created_at": day_dt,
            })

        # --- Kiem ke cuoi thang (ngay 28) ---
        if current.day == 28:
            for w in warehouses:
                st_id = ids.next("stock_take")
                stock_takes.append({
                    "id": st_id, "code": f"STK{st_id:04d}", "warehouse_id": w["id"], "status": "APPROVED",
                    "created_by": random.choice(user_ids), "created_at": day_dt,
                })
                for p in random.sample(products, k=min(8, len(products))):
                    system_qty = stock[(p["id"], w["id"])]
                    diff = round(random.uniform(-3, 3), 0)
                    actual_qty = max(0, system_qty + diff)
                    real_diff = actual_qty - system_qty
                    stock_take_details.append({
                        "id": ids.next("stock_take_detail"), "stock_take_id": st_id, "product_id": p["id"],
                        "system_quantity": system_qty, "actual_quantity": actual_qty, "difference": real_diff,
                    })
                    if real_diff != 0:
                        stock[(p["id"], w["id"])] = actual_qty
                        add_stock_txn(p["id"], w["id"], "ADJUST", real_diff, "STOCK_TAKE", st_id, day_dt)

        current += timedelta(days=1)

    # --- Cay bat thuong: 1 vai ngay xuat kho tang dot bien cho 1 SP (De AI-03 co gi de bat) ---
    for _ in range(ANOMALY_COUNT):
        p = random.choice(products)
        w = random.choice(warehouses)
        anomaly_date = end_date - timedelta(days=random.randint(5, 45))
        anomaly_dt = datetime.combine(anomaly_date, datetime.min.time()).replace(hour=15)
        spike_qty = round(random.uniform(300, 600), 0)

        # bom them 1 phieu nhap ngay truoc do de du ton dap ung con so bat thuong
        gr_id = ids.next("goods_receipt")
        goods_receipts.append({
            "id": gr_id, "doc_number": f"GR{gr_id:06d}", "doc_date": anomaly_date - timedelta(days=1),
            "posting_date": anomaly_date - timedelta(days=1), "supplier_id": random.choice(suppliers)["id"],
            "warehouse_id": w["id"], "status": "CLOSED", "remarks": "Seed: bo sung truoc diem bat thuong",
            "created_by": random.choice(user_ids), "created_at": anomaly_dt - timedelta(days=1),
        })
        goods_receipt_details.append({
            "id": ids.next("goods_receipt_detail"), "goods_receipt_id": gr_id, "product_id": p["id"],
            "quantity": spike_qty, "unit_price": round(p["price"] * 0.7, 2), "amount": round(spike_qty * p["price"] * 0.7, 2),
        })
        stock[(p["id"], w["id"])] += spike_qty
        add_stock_txn(p["id"], w["id"], "IN", spike_qty, "GOODS_RECEIPT", gr_id, anomaly_dt - timedelta(days=1))

        so_id = ids.next("sales_order")
        customer = random.choice(customers)
        amount = round(spike_qty * p["price"], 2)
        sales_orders.append({
            "id": so_id, "doc_number": f"SO{so_id:06d}", "doc_date": anomaly_date, "customer_id": customer["id"],
            "warehouse_id": w["id"], "status": "CONFIRMED", "total_amount": amount,
            "created_by": random.choice(user_ids), "created_at": anomaly_dt,
        })
        sales_order_details.append({
            "id": ids.next("sales_order_detail"), "sales_order_id": so_id, "product_id": p["id"],
            "quantity": spike_qty, "unit_price": p["price"], "amount": amount,
        })
        stock[(p["id"], w["id"])] -= spike_qty
        add_stock_txn(p["id"], w["id"], "OUT", spike_qty, "SALES_ORDER", so_id, anomaly_dt)
        print(f"  [anomaly] {anomaly_date} SP={p['code']} kho={w['code']} xuat dot bien {spike_qty}")

    # --- Ep vai SP ve ton thap + tao stock_alert (De cảnh bao sap het hang co du lieu) ---
    low_stock_targets = random.sample(products, k=min(LOW_STOCK_PRODUCT_COUNT, len(products)))
    stock_alerts = []
    for p in low_stock_targets:
        w = random.choice(warehouses)
        current_qty = stock[(p["id"], w["id"])]
        if current_qty > 5:
            drain_qty = current_qty - random.uniform(0, 5)
            stock[(p["id"], w["id"])] -= drain_qty
            add_stock_txn(p["id"], w["id"], "ADJUST", -drain_qty, "SEED_ADJUSTMENT", 0, datetime.combine(end_date, datetime.min.time()))
        stock_alerts.append({
            "id": ids.next("stock_alert"), "product_id": p["id"], "warehouse_id": w["id"],
            "min_quantity": round(stock[(p["id"], w["id"])] + random.uniform(15, 30), 0), "status": "ACTIVE",
        })
        print(f"  [low-stock] SP={p['code']} kho={w['code']} con {stock[(p['id'], w['id'])]:.0f}")

    stock_rows = [
        {"id": ids.next("stock"), "product_id": p["id"], "warehouse_id": w["id"], "quantity": max(0, stock[(p["id"], w["id"])])}
        for p in products for w in warehouses
    ]

    return {
        "goods_receipt": goods_receipts, "goods_receipt_detail": goods_receipt_details,
        "sales_order": sales_orders, "sales_order_detail": sales_order_details,
        "stock_transaction": stock_transactions, "stock_take": stock_takes, "stock_take_detail": stock_take_details,
        "stock_alert": stock_alerts, "stock": stock_rows,
    }


# ============================================================================
# BUOC 3: GHI VAO DB
# ============================================================================
DELETE_ORDER = [
    "stock_alert", "stock_take_detail", "stock_take", "stock_transaction", "stock",
    "sales_order_detail", "sales_order", "customer",
    "goods_receipt_detail", "goods_receipt",
    "price_list_item", "price_list",
    "warehouse", "supplier",
    "product", "product_category",
    "uom_conversion", "uom_group", "uom", "tax_group",
]
MASTER_INSERT_ORDER = [
    "tax_group", "uom", "uom_group", "uom_conversion",
    "product_category", "product", "supplier", "warehouse", "customer",
    "price_list", "price_list_item",
]
TXN_INSERT_ORDER = [
    "goods_receipt", "goods_receipt_detail",
    "sales_order", "sales_order_detail",
    "stock_transaction", "stock_take", "stock_take_detail", "stock_alert", "stock",
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--months", type=int, default=6, help="So thang lich su can sinh (mac dinh 6)")
    parser.add_argument("--force", action="store_true", help="Xoa data seed cu (bang 'seed_%%' user + toan bo bang nghiep vu) truoc khi sinh lai")
    args = parser.parse_args()

    engine = build_engine()
    metadata = MetaData()
    metadata.reflect(bind=engine)

    required_tables = set(MASTER_INSERT_ORDER) | set(TXN_INSERT_ORDER) | {"role", "user"}
    missing = required_tables - set(metadata.tables.keys())
    if missing:
        raise SystemExit(
            f"Thieu bang: {missing}. Chay Flyway (mvn spring-boot:run, toi it nhat V16) truoc khi chay script nay."
        )

    with engine.begin() as conn:
        product_count = conn.execute(select(metadata.tables["product"])).fetchone()
        if product_count and not args.force:
            raise SystemExit(
                "Bang 'product' da co du lieu. Neu muon sinh lai tu dau, chay lai voi --force "
                "(se xoa toan bo data seed cu truoc khi sinh moi, KHONG dong den du lieu ban tu tay them)."
            )

        if args.force:
            print("Dang xoa data seed cu...")
            conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
            for t in DELETE_ORDER:
                conn.execute(delete(metadata.tables[t]))
            conn.execute(delete(metadata.tables["user"]).where(
                metadata.tables["user"].c.username.like(f"{SEED_USER_PREFIX}%")
            ))
            conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))

        role_row = conn.execute(
            select(metadata.tables["role"]).where(metadata.tables["role"].c.code == "ADMIN")
        ).fetchone()
        if not role_row:
            raise SystemExit("Khong tim thay role ADMIN (tu V1__init_schema.sql). Chay Flyway truoc.")
        role_id = role_row.id

        max_user_id = conn.execute(
            select(metadata.tables["user"].c.id).order_by(metadata.tables["user"].c.id.desc()).limit(1)
        ).scalar()
        ids.counters["user"] = max_user_id or 0

        print("Dang sinh master data (danh muc Orion that + UOM + bang gia)...")
        md = build_master_data()
        seed_users = build_seed_users(role_id)
        user_ids = [u["id"] for u in seed_users]

        print(f"Dang sinh giao dich {args.months} thang (co the mat vai giay)...")
        data = generate_transactions(
            args.months, md["products"], md["product_weights"], md["suppliers"], md["warehouses"],
            md["customers"], user_ids,
        )

        md_key_by_table = {
            "tax_group": "tax_groups", "uom": "uoms", "uom_group": "uom_groups",
            "uom_conversion": "uom_conversions", "product_category": "categories",
            "product": "products", "supplier": "suppliers", "warehouse": "warehouses",
            "customer": "customers", "price_list": "price_lists", "price_list_item": "price_list_items",
        }

        def rows_for_table(table, rows):
            """Loc bo cac key khong con la cot that (vd 'price'/'unit' tren product da bi
            V19 xoa) - cac key nay chi con dung noi bo cho tinh toan trong file nay."""
            cols = set(table.columns.keys())
            return [{k: v for k, v in r.items() if k in cols} for r in rows]

        print("Dang ghi vao DB...")
        conn.execute(metadata.tables["user"].insert(), seed_users)
        for t in MASTER_INSERT_ORDER:
            rows = md[md_key_by_table[t]]
            if rows:
                conn.execute(metadata.tables[t].insert(), rows_for_table(metadata.tables[t], rows))
        for t in TXN_INSERT_ORDER:
            if data[t]:
                conn.execute(metadata.tables[t].insert(), rows_for_table(metadata.tables[t], data[t]))

    print("\nXong! Da sinh:")
    print(f"  - {len(md['products'])} san pham Orion, {len(md['uoms'])} UOM, {len(md['uom_groups'])} nhom quy doi")
    print(f"  - {len(md['suppliers'])} NCC, {len(md['warehouses'])} kho, {len(md['customers'])} khach hang")
    print(f"  - {len(data['goods_receipt'])} phieu nhap, {len(data['sales_order'])} don ban")
    print(f"  - {len(data['stock_alert'])} canh bao sap het hang")
    print("Tiep theo: chay ETL (etl/run_etl.py) de nap data nay vao Data Warehouse.")


if __name__ == "__main__":
    main()
