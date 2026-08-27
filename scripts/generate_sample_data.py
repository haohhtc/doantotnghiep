"""
Sinh du lieu mau lich su (N thang) cho CSDL OLTP (erp_qlkho_oltp) de Backend/ETL/BI/AI co
data thuc te de demo - khong phai "vai dong test" khong co pattern gi.

YEU CAU TRUOC KHI CHAY:
  - Da chay Flyway (mvn spring-boot:run 1 lan, hoac chay thang
    backend/src/main/resources/db/migration/V1..V5) de cac bang da ton tai.
  - .env o thu muc goc project da co OLTP_DB_* dung (xem .env.example).

CACH CHAY:
  cd scripts
  pip install -r requirements.txt
  python generate_sample_data.py --months 6
  python generate_sample_data.py --months 6 --force   # xoa data seed cu (chi data do seed_%),
                                                        # sinh lai tu dau

Y TUONG MO PHONG (khong random thuan tuy):
  - Moi san pham co 1 "do pho bien" khac nhau (kieu Pareto) -> vai SP ban chay, nhieu SP it ban.
  - Có xu huong tang nhe theo thoi gian + ban chay hon vao cuoi tuan.
  - Co gia 2-3 diem BAT THUONG that ro (xuat kho tang dot bien) -> Anomaly Detection co gi de bat.
  - Cuoi giai doan, vai san pham bi ep ton kho xuong thap + tao stock_alert -> Stock Risk co du lieu.
"""

import argparse
import random
from datetime import date, datetime, timedelta

import numpy as np
from dotenv import load_dotenv
from pathlib import Path
import os
from sqlalchemy import create_engine, MetaData, delete, select

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

# ============================================================================
# CAU HINH
# ============================================================================
NUM_CATEGORIES = 8
NUM_PRODUCTS = 80
NUM_SUPPLIERS = 8
NUM_WAREHOUSES = 3
NUM_CUSTOMERS = 40
DAILY_ORDERS_RANGE = (5, 20)       # so don ban / ngay
RECEIPT_PROBABILITY = 0.35         # xac suat 1 kho nhap hang trong 1 ngay
ANOMALY_COUNT = 3                  # so diem bat thuong co tinh cay
LOW_STOCK_PRODUCT_COUNT = 5        # so san pham bi ep ve ton thap cuoi giai doan
SEED_USER_PREFIX = "seed_"

# ============================================================================
# DU LIEU MAU DE GHEP TEN (thuan tuy hu cau, khong lien quan cong ty/khach hang that)
# ============================================================================
CATEGORY_NAMES = [
    "Nuoc giai khat", "Banh keo", "Sua va che pham", "Gia vi",
    "Do hop", "Mi - Chao - Pho an lien", "Cham soc ca nhan", "Ve sinh nha cua",
]
PRODUCT_TEMPLATES = {
    "Nuoc giai khat": ["Nuoc ngot co ga", "Nuoc suoi", "Nuoc tang luc", "Tra dong chai", "Nuoc ep trai cay"],
    "Banh keo": ["Banh quy bo", "Keo deo trai cay", "Banh xop", "Socola thanh", "Banh gao"],
    "Sua va che pham": ["Sua tuoi tiet trung", "Sua chua uong", "Sua dac", "Pho mai lat", "Sua hat"],
    "Gia vi": ["Nuoc mam", "Nuoc tuong", "Hat nem", "Dau an", "Tuong ot"],
    "Do hop": ["Ca hop", "Thit hop", "Rau cu hop", "Xuc xich hop", "Pate hop"],
    "Mi - Chao - Pho an lien": ["Mi ly", "Mi goi", "Chao an lien", "Pho an lien", "Bun an lien"],
    "Cham soc ca nhan": ["Dau goi dau", "Sua tam", "Kem danh rang", "Khan giay", "Nuoc rua tay"],
    "Ve sinh nha cua": ["Nuoc lau san", "Nuoc rua chen", "Bot giat", "Nuoc xa vai", "Tui rac"],
}
UNITS = ["Thung", "Loc", "Chai", "Hop", "Goi", "Cai", "Bich"]
SUPPLIER_NAMES = [
    "Cong ty TNHH Thuong mai An Phat", "Cong ty CP Minh Long", "Cong ty TNHH Viet Thanh",
    "Cong ty CP Hoang Gia", "Cong ty TNHH Dai Duong", "Cong ty CP Phu Quy",
    "Cong ty TNHH Thanh Cong", "Cong ty CP Tan Tien",
]
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
def build_master_data():
    categories = []
    for i, name in enumerate(CATEGORY_NAMES[:NUM_CATEGORIES], start=1):
        categories.append({"id": ids.next("product_category"), "code": f"CAT{i:02d}", "name": name, "parent_id": None})

    products = []
    product_weights = []
    for i in range(1, NUM_PRODUCTS + 1):
        cat = categories[(i - 1) % len(categories)]
        template = random.choice(PRODUCT_TEMPLATES[cat["name"]])
        size = random.choice(["330ml", "500ml", "1L", "100g", "250g", "500g", "1kg"])
        products.append({
            "id": ids.next("product"),
            "code": f"SP{i:04d}",
            "name": f"{template} {size} #{i}",
            "foreign_name": None,
            "category_id": cat["id"],
            "unit": random.choice(UNITS),
            "price": round(random.uniform(5_000, 500_000), -2),
            "description": None,
            "active": True,
        })
    # Do pho bien kieu Pareto: xao thu tu trong so 1/rank de vai SP ban chay, nhieu SP it ban
    ranks = list(range(1, NUM_PRODUCTS + 1))
    random.shuffle(ranks)
    product_weights = [1.0 / r for r in ranks]

    suppliers = []
    for i, name in enumerate(SUPPLIER_NAMES[:NUM_SUPPLIERS], start=1):
        suppliers.append({
            "id": ids.next("supplier"), "code": f"NCC{i:02d}", "name": name, "foreign_name": None,
            "contact_person": f"{random.choice(SURNAMES)} {random.choice(GIVEN_NAMES)}",
            "phone": f"09{random.randint(10000000, 99999999)}",
            "email": f"lienhe{i}@ncc-mau.vn", "address": f"{random.randint(1,300)} {random.choice(STREETS)}, {random.choice(DISTRICTS)}",
            "active": True,
        })

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

    return categories, products, product_weights, suppliers, warehouses, customers


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
def generate_transactions(months, categories, products, product_weights, suppliers, warehouses, customers, user_ids):
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
                for p in random.sample(products, k=random.randint(2, 5)):
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
    "warehouse", "supplier", "product", "product_category",
]
INSERT_ORDER = [
    "product_category", "product", "supplier", "warehouse", "customer",
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

    required_tables = set(INSERT_ORDER) | {"role", "user"}
    missing = required_tables - set(metadata.tables.keys())
    if missing:
        raise SystemExit(
            f"Thieu bang: {missing}. Chay Flyway (mvn spring-boot:run) hoac "
            f"docs/03-database/full-schema-oltp.sql truoc khi chay script nay."
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
            for t in DELETE_ORDER:
                conn.execute(delete(metadata.tables[t]))
            conn.execute(delete(metadata.tables["user"]).where(
                metadata.tables["user"].c.username.like(f"{SEED_USER_PREFIX}%")
            ))

        role_row = conn.execute(
            select(metadata.tables["role"]).where(metadata.tables["role"].c.code == "ADMIN")
        ).fetchone()
        if not role_row:
            raise SystemExit("Khong tim thay role ADMIN (tu V1__init_schema.sql). Chay Flyway truoc.")
        role_id = role_row.id

        print("Dang sinh master data...")
        categories, products, weights, suppliers, warehouses, customers = build_master_data()
        seed_users = build_seed_users(role_id)
        user_ids = [u["id"] for u in seed_users]

        print(f"Dang sinh giao dich {args.months} thang (co the mat vai giay)...")
        data = generate_transactions(args.months, categories, products, weights, suppliers, warehouses, customers, user_ids)

        print("Dang ghi vao DB...")
        conn.execute(metadata.tables["user"].insert(), seed_users)
        conn.execute(metadata.tables["product_category"].insert(), categories)
        conn.execute(metadata.tables["product"].insert(), products)
        conn.execute(metadata.tables["supplier"].insert(), suppliers)
        conn.execute(metadata.tables["warehouse"].insert(), warehouses)
        conn.execute(metadata.tables["customer"].insert(), customers)
        for t in ["goods_receipt", "goods_receipt_detail", "sales_order", "sales_order_detail",
                  "stock_transaction", "stock_take", "stock_take_detail", "stock_alert", "stock"]:
            if data[t]:
                conn.execute(metadata.tables[t].insert(), data[t])

    print("\nXong! Da sinh:")
    print(f"  - {len(products)} san pham, {len(suppliers)} NCC, {len(warehouses)} kho, {len(customers)} khach hang")
    print(f"  - {len(data['goods_receipt'])} phieu nhap, {len(data['sales_order'])} don ban")
    print(f"  - {len(data['stock_alert'])} canh bao sap het hang")
    print("Tiep theo: chay ETL (etl/run_etl.py) de nap data nay vao Data Warehouse.")


if __name__ == "__main__":
    main()
