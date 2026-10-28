"""Chia nho tuyen ban hang o chi nhanh TP.HCM: 2 tuyen (qua rong, 1 tuyen "phu" ca khu trung
tam) -> 30 tuyen nho (dung nghiep vu that: 1 tuyen = 1-3 con duong trong 1 phuong/xa, 15-20
khach hang, 1 salesman di het trong ngay). Moi khach hang co lich ghe tham rieng (3-4
ngay/tuan, trai deu ca tuan) qua cac cot thu/tuan cua route_master_outlet.

KHONG dong den sales_order cua HN/DN. 20 khach hang HCM hien co duoc GIU LAI (khong xoa,
chi gan lai tuyen moi) - ~460 khach hang moi duoc tao them de du 30 tuyen x 16 khach.
KHONG sinh lich su don hang cho khach moi (chi cau truc Route/KH/lich ghe tham).

CHAY 1 LAN: cd scripts && python expand_hcm_routes.py
"""
import random
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import os

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")
random.seed(23)

ADMIN123_HASH = "$2a$10$zuJMJpzJK5JmtGKGAlsdP.R2F2cfk3c2EpNf6WDRvpcTw2lXxLs52"

NUM_ROUTES = 30
CUSTOMERS_PER_ROUTE = 16
ZONES = 5  # 30 tuyen / 5 vung = 6 tuyen/vung

HCM_STREETS = [
    "Le Loi", "Nguyen Trai", "Cach Mang Thang 8", "Vo Van Tan", "Ly Thuong Kiet", "Hai Ba Trung",
    "Dien Bien Phu", "Nguyen Thi Minh Khai", "Tran Hung Dao", "Pasteur", "Nam Ky Khoi Nghia",
    "Hoang Van Thu", "Cong Hoa", "Truong Chinh", "Au Co", "Lac Long Quan", "Phan Van Tri",
    "Quang Trung", "Nguyen Oanh", "Le Van Viet", "Do Xuan Hop", "Nguyen Duy Trinh",
    "Huynh Tan Phat", "Nguyen Van Linh", "Nguyen Huu Tho", "Pham Hung", "Ta Quang Buu",
    "Duong Ba Trac", "Hau Giang", "Binh Long", "Au Duong Lan", "Nguyen Tri Phuong",
    "Su Van Hanh", "Ba Thang Hai", "Le Hong Phong", "Nguyen Chi Thanh", "Tran Phu",
    "Hung Vuong", "An Duong Vuong", "Kinh Duong Vuong",
]
OUTLET_PREFIXES = ["Tap hoa", "Cua hang tap hoa", "Tiem tap hoa", "Sap"]
RELATIONS = ["Co", "Chu", "Bac", "Di", "Anh", "Chi", "Ong", "Ba"]
GIVEN_NAMES = ["An", "Binh", "Chau", "Dung", "Giang", "Hoa", "Khang", "Lan", "Nam", "Phuc",
               "Quyen", "Trang", "Tuan", "Hanh", "Loan", "Thao", "Vy", "Y", "Son", "Mai"]
SURNAMES = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Huynh", "Vo", "Dang", "Bui", "Do"]


def env(key, default=None):
    return os.getenv(key, default)


def build_engine():
    user = env("OLTP_DB_USER", "erp_user")
    pwd = env("OLTP_DB_PASSWORD", "erp_password")
    host = env("OLTP_DB_HOST", "localhost")
    port = env("OLTP_DB_PORT", "3306")
    name = env("OLTP_DB_NAME", "erp_qlkho_oltp")
    return create_engine(f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{name}?charset=utf8mb4")


def outlet_name():
    return f"{random.choice(OUTLET_PREFIXES)} {random.choice(RELATIONS)} {random.choice(GIVEN_NAMES)}"


def visit_days():
    """3-4 ngay/tuan, random nhung du lon (~16 KH/tuyen x 3.5 ngay = ~56 luot/tuan, trai deu
    7 ngay ~8/ngay) de khong dong don vao cung 1 ngay."""
    k = random.choice([3, 3, 4])
    days = random.sample(range(7), k)
    cols = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    return {cols[d]: 1 for d in days}


def main():
    engine = build_engine()

    with engine.begin() as conn:
        hcm_branch_id = conn.execute(text("SELECT id FROM branch WHERE code = 'CN-HCM'")).scalar()
        gt_channel_id = conn.execute(text("SELECT id FROM customer_channel WHERE code = 'GT'")).scalar()
        role_id = conn.execute(text("SELECT id FROM role WHERE code = 'SALES_STAFF'")).scalar()
        pos_salesman = conn.execute(text("SELECT id FROM employee_position WHERE code = 'SALESMAN'")).scalar()
        manager_emp_id = conn.execute(text("""
            SELECT e.id FROM employee e JOIN user u ON u.id = e.user_id
            WHERE u.username = 'qlvung01'
        """)).scalar()
        bridge_district_id = conn.execute(text("""
            SELECT d.id FROM district d JOIN province p ON p.id = d.province_id WHERE p.code = 'HCM'
        """)).scalar()

        old_route_ids = [r[0] for r in conn.execute(text(
            "SELECT id FROM route_master WHERE branch_id = :b"), {"b": hcm_branch_id}
        ).fetchall()]
        if old_route_ids:
            print(f"Xoa {len(old_route_ids)} tuyen HCM cu va du lieu lien quan (giu lai customer)...")
            conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
            placeholders = ",".join(str(i) for i in old_route_ids)
            conn.execute(text(f"UPDATE sales_order SET route_master_id=NULL, salesman_id=NULL "
                               f"WHERE route_master_id IN ({placeholders})"))
            conn.execute(text(f"DELETE FROM route_master_outlet WHERE route_master_id IN ({placeholders})"))
            conn.execute(text(f"DELETE FROM route_salesman_assignment WHERE route_master_id IN ({placeholders})"))
            conn.execute(text(f"DELETE FROM route_manager_assignment WHERE route_master_id IN ({placeholders})"))
            conn.execute(text(f"DELETE FROM route_master WHERE id IN ({placeholders})"))
            conn.execute(text("DELETE FROM selling_zone WHERE branch_id = :b"), {"b": hcm_branch_id})
            conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))

        wards = conn.execute(text("""
            SELECT w.id, w.name FROM ward w
            JOIN district d ON d.id = w.district_id
            JOIN province p ON p.id = d.province_id
            WHERE p.code = 'HCM' ORDER BY w.code LIMIT :n
        """), {"n": NUM_ROUTES}).fetchall()

        existing_customers = conn.execute(text(
            "SELECT id FROM customer WHERE branch_id = :b ORDER BY id"), {"b": hcm_branch_id}
        ).fetchall()
        existing_customer_ids = [r[0] for r in existing_customers]

        max_user_id = conn.execute(text("SELECT MAX(id) FROM user")).scalar() or 0
        max_customer_id = conn.execute(text("SELECT MAX(id) FROM customer")).scalar() or 0
        next_user_id = max_user_id + 1
        next_customer_id = max_customer_id + 1
        sale_seq = 7  # sale01..sale06 da dung cho lan truoc

        effective_date = date.today() - timedelta(days=240)
        zone_ids = []
        for z in range(1, ZONES + 1):
            zid = conn.execute(text(
                "INSERT INTO selling_zone (code, name, branch_id) VALUES (:c, :n, :b)"
            ), {"c": f"SZ-HCM-{z:02d}", "n": f"Vung HCM {z:02d}", "b": hcm_branch_id}).lastrowid
            zone_ids.append(zid)

        existing_pool = list(existing_customer_ids)
        route_ids = []
        for i, (ward_id, ward_name) in enumerate(wards):
            route_num = i + 1
            zone_id = zone_ids[i // (NUM_ROUTES // ZONES)]
            streets = random.sample(HCM_STREETS, k=random.choice([1, 2, 3]))
            rcode = f"R-HCM-{route_num:02d}"
            rid = conn.execute(text("""
                INSERT INTO route_master (code, name, selling_zone_id, branch_id, effective_date)
                VALUES (:c, :n, :z, :b, :eff)
            """), {"c": rcode, "n": f"Tuyen {ward_name} ({'/'.join(streets)})",
                    "z": zone_id, "b": hcm_branch_id, "eff": effective_date}).lastrowid
            route_ids.append(rid)

            if route_num == 1:
                sm_user_id = conn.execute(text("SELECT id FROM user WHERE username = 'sale01'")).scalar()
                sm_emp_id = conn.execute(text("SELECT id FROM employee WHERE user_id = :u"), {"u": sm_user_id}).scalar()
            else:
                username = f"sale{sale_seq:02d}"
                sale_seq += 1
                sm_user_id = next_user_id
                next_user_id += 1
                full_name = f"{random.choice(SURNAMES)} {random.choice(['Van','Thi','Minh','Duc'])} {random.choice(GIVEN_NAMES)} ({rcode})"
                conn.execute(text("""
                    INSERT INTO user (id, username, password, full_name, email, role_id, status)
                    VALUES (:id, :u, :p, :n, :e, :r, 'ACTIVE')
                """), {"id": sm_user_id, "u": username, "p": ADMIN123_HASH, "n": full_name,
                        "e": f"{username}@example-mau.vn", "r": role_id})
                sm_emp_id = conn.execute(text("""
                    INSERT INTO employee (type, code, full_name, position_id, is_delivery_man, active, user_id, created_at)
                    VALUES ('NVBH', :code, :n, :pos, 0, 1, :uid, NOW())
                """), {"code": f"EMP-{username}", "n": full_name, "pos": pos_salesman, "uid": sm_user_id}).lastrowid

            conn.execute(text("""
                INSERT INTO route_salesman_assignment (route_master_id, employee_id, effective_date)
                VALUES (:r, :e, :eff)
            """), {"r": rid, "e": sm_emp_id, "eff": effective_date})
            conn.execute(text("""
                INSERT INTO route_manager_assignment (route_master_id, employee_id, effective_date)
                VALUES (:r, :e, :eff)
            """), {"r": rid, "e": manager_emp_id, "eff": effective_date})

            # Khach hang cho tuyen nay: uu tien tai su dung khach cu (round-robin), con lai tao moi
            route_customer_ids = []
            if existing_pool and route_num <= len(existing_customer_ids):
                cust_id = existing_pool.pop(0)
                route_customer_ids.append(cust_id)
                conn.execute(text("""
                    UPDATE customer SET ward_id = :w, district_id = :d, channel_id = COALESCE(channel_id, :ch)
                    WHERE id = :id
                """), {"w": ward_id, "d": bridge_district_id, "ch": gt_channel_id, "id": cust_id})

            while len(route_customer_ids) < CUSTOMERS_PER_ROUTE:
                cid = next_customer_id
                next_customer_id += 1
                street = random.choice(streets)
                conn.execute(text("""
                    INSERT INTO customer (id, code, name, phone, email, address, active,
                                           district_id, ward_id, channel_id, branch_id)
                    VALUES (:id, :code, :name, :phone, :email, :addr, 1, :d, :w, :ch, :b)
                """), {
                    "id": cid, "code": f"KH{cid:04d}", "name": outlet_name(),
                    "phone": f"09{random.randint(10000000, 99999999)}",
                    "email": f"kh{cid}@example-mau.vn",
                    "addr": f"{random.randint(1, 300)} Duong {street}, {ward_name}",
                    "d": bridge_district_id, "w": ward_id, "ch": gt_channel_id, "b": hcm_branch_id,
                })
                route_customer_ids.append(cid)

            for order, cust_id in enumerate(route_customer_ids, start=1):
                vd = visit_days()
                cols = ", ".join(vd.keys())
                vals = ", ".join(f":{k}" for k in vd.keys())
                conn.execute(text(f"""
                    INSERT INTO route_master_outlet (route_master_id, customer_id, visit_order{', ' + cols if cols else ''})
                    VALUES (:r, :c, :v{', ' + vals if vals else ''})
                """), {"r": rid, "c": cust_id, "v": order, **vd})

        # Gan lai route_master_id/salesman_id cho TOAN BO don hang (an toan chay lai nhieu lan,
        # chi anh huong don hang cua khach da doi tuyen - HN/DN khong doi nen khong bi dung toi).
        conn.execute(text("""
            UPDATE sales_order so
            JOIN route_master_outlet rmo ON rmo.customer_id = so.customer_id
            JOIN route_salesman_assignment rsa ON rsa.route_master_id = rmo.route_master_id AND rsa.end_date IS NULL
            JOIN employee e ON e.id = rsa.employee_id
            SET so.route_master_id = rmo.route_master_id, so.salesman_id = e.user_id
        """))

        n_customers = conn.execute(text(
            "SELECT COUNT(*) FROM customer WHERE branch_id = :b"), {"b": hcm_branch_id}
        ).scalar()
        n_routes = len(route_ids)

    print(f"\nDa tao {n_routes} tuyen tai HCM (5 vung x 6 tuyen), moi tuyen {CUSTOMERS_PER_ROUTE} khach hang.")
    print(f"Tong khach hang HCM hien tai: {n_customers} (giu nguyen {len(existing_customer_ids)} khach cu).")
    print(f"Tao them {sale_seq - 7} salesman moi (sale07..sale{sale_seq - 1}), tai dung sale01 cho tuyen 1.")
    print("Tiep theo: chay 'python ../etl/run_etl.py' de dong bo vao Data Warehouse.")


if __name__ == "__main__":
    main()
