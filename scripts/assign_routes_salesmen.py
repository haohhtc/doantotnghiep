"""Xay dung cau truc Route (DMS that): moi chi nhanh co 2 Vung ban hang (Selling Zone), moi
vung co 1 Tuyen (Route Master), moi tuyen gan 1 Salesman + 1 Quan ly tuyen (Route Manager),
va toan bo khach hang hien co duoc chia vao dung 1 tuyen theo chi nhanh. Sau do gan lai
route_master_id/salesman_id cho TAT CA don hang ban theo dung tuyen cua khach hang do.

Muc dich: bao cao "doanh so theo salesman" (dang lam ben Power BI) hien dang trong vi
sales_order.salesman_id chua duoc gan - script nay phan bo qua nhieu salesman/tuyen/vung
de bao cao co du lieu thuc su phan hoa.

CHAY 1 LAN tren DB da co du 40 customer + 3 branch (sau seed_geography.py + assign_geography.py).
CACH CHAY: cd scripts && python assign_routes_salesmen.py
"""
import random
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import os

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")
random.seed(11)

ADMIN123_HASH = "$2a$10$zuJMJpzJK5JmtGKGAlsdP.R2F2cfk3c2EpNf6WDRvpcTw2lXxLs52"

SURNAMES = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Huynh", "Vo", "Dang", "Bui", "Do"]
MIDDLE_NAMES = ["Van", "Thi", "Minh", "Duc", "Ngoc", "Thanh", "Huu", "Thu"]
GIVEN_NAMES = ["An", "Binh", "Chau", "Dung", "Giang", "Hoa", "Khang", "Lan", "Nam", "Phuc"]


def random_name():
    return f"{random.choice(SURNAMES)} {random.choice(MIDDLE_NAMES)} {random.choice(GIVEN_NAMES)}"


def env(key, default=None):
    return os.getenv(key, default)


def build_engine():
    user = env("OLTP_DB_USER", "erp_user")
    pwd = env("OLTP_DB_PASSWORD", "erp_password")
    host = env("OLTP_DB_HOST", "localhost")
    port = env("OLTP_DB_PORT", "3306")
    name = env("OLTP_DB_NAME", "erp_qlkho_oltp")
    return create_engine(f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{name}?charset=utf8mb4")


# 2 vung ban hang / chi nhanh -> 2 tuyen / chi nhanh = 6 tuyen tong cong
ZONE_DEFS = [
    ("CN-HCM", "SZ-HCM-01", "Vung HCM - Khu Trung tam"),
    ("CN-HCM", "SZ-HCM-02", "Vung HCM - Khu Ngoai thanh"),
    ("CN-HN", "SZ-HN-01", "Vung Ha Noi - Khu Trung tam"),
    ("CN-HN", "SZ-HN-02", "Vung Ha Noi - Khu Ngoai thanh"),
    ("CN_DN", "SZ-DN-01", "Vung Da Nang - Khu 1"),
    ("CN_DN", "SZ-DN-02", "Vung Da Nang - Khu 2"),
]


def main():
    engine = build_engine()

    with engine.begin() as conn:
        existing_routes = conn.execute(text("SELECT COUNT(*) FROM route_master")).scalar()
        if existing_routes:
            print(f"Bang 'route_master' da co {existing_routes} dong - xoa de dung lai tu dau "
                  f"(cung xoa route_master_outlet/route_salesman_assignment/route_manager_assignment, "
                  f"va go route_master_id/salesman_id khoi sales_order).")
            conn.execute(text("UPDATE sales_order SET route_master_id = NULL, salesman_id = NULL"))
            conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
            for t in ["route_salesman_assignment", "route_manager_assignment", "route_master_outlet", "route_master", "selling_zone"]:
                conn.execute(text(f"DELETE FROM {t}"))
            conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))

        role_id = conn.execute(text("SELECT id FROM role WHERE code = 'SALES_STAFF'")).scalar()
        pos_salesman = conn.execute(text("SELECT id FROM employee_position WHERE code = 'SALESMAN'")).scalar()
        pos_supervisor = conn.execute(text("SELECT id FROM employee_position WHERE code = 'SS'")).scalar()
        type_presell = conn.execute(text("SELECT id FROM salesman_type WHERE code = 'PRESELL'")).scalar()

        branches = {row[1]: row[0] for row in conn.execute(text("SELECT id, code FROM branch")).fetchall()}

        max_user_id = conn.execute(text("SELECT MAX(id) FROM user")).scalar() or 0
        next_user_id = max_user_id + 1

        def create_user_and_employee(username, full_name, is_manager):
            nonlocal next_user_id
            uid = next_user_id
            next_user_id += 1
            conn.execute(text("""
                INSERT INTO user (id, username, password, full_name, email, role_id, status)
                VALUES (:id, :u, :p, :n, :e, :r, 'ACTIVE')
            """), {"id": uid, "u": username, "p": ADMIN123_HASH, "n": full_name,
                    "e": f"{username}@example-mau.vn", "r": role_id})
            emp_id = conn.execute(text("""
                INSERT INTO employee (type, code, full_name, position_id, is_delivery_man, active, user_id, created_at)
                VALUES (:type, :code, :n, :pos, 0, 1, :uid, NOW())
            """), {"type": "NV" if is_manager else "NVBH", "code": f"EMP-{username}", "n": full_name,
                    "pos": pos_supervisor if is_manager else pos_salesman, "uid": uid}).lastrowid
            return uid, emp_id

        # 1 quan ly / chi nhanh (phu trach ca 2 tuyen cua chi nhanh do)
        manager_employee_by_branch = {}
        for i, branch_code in enumerate(["CN-HCM", "CN-HN", "CN_DN"], start=1):
            username = f"qlvung{i:02d}"
            _, emp_id = create_user_and_employee(username, f"{random_name()} (QL vung {branch_code})", is_manager=True)
            manager_employee_by_branch[branch_code] = emp_id
            print(f"  Tao quan ly {username} -> chi nhanh {branch_code}")

        # sale01 co san -> dung lam salesman cho tuyen dau tien (SZ-HCM-01), con lai tao moi
        sale01_user_id = conn.execute(text("SELECT id FROM user WHERE username = 'sale01'")).scalar()
        sale01_emp_id = conn.execute(text("SELECT id FROM employee WHERE user_id = :u"), {"u": sale01_user_id}).scalar()
        if not sale01_emp_id:
            sale01_emp_id = conn.execute(text("""
                INSERT INTO employee (type, code, full_name, position_id, is_delivery_man, active, user_id, created_at)
                VALUES ('NVBH', 'EMP-sale01', 'Nhan vien Sale (sale01)', :pos, 0, 1, :uid, NOW())
            """), {"pos": pos_salesman, "uid": sale01_user_id}).lastrowid

        effective_date = date.today() - timedelta(days=240)

        zone_id = {}
        route_id = {}
        route_salesman_user_id = {}
        first_zone = True
        salesman_seq = 2
        for branch_code, zcode, zname in ZONE_DEFS:
            zid = conn.execute(text("""
                INSERT INTO selling_zone (code, name, branch_id) VALUES (:c, :n, :b)
            """), {"c": zcode, "n": zname, "b": branches[branch_code]}).lastrowid
            zone_id[zcode] = zid

            rcode = zcode.replace("SZ-", "R-")
            rid = conn.execute(text("""
                INSERT INTO route_master (code, name, selling_zone_id, branch_id, effective_date)
                VALUES (:c, :n, :z, :b, :eff)
            """), {"c": rcode, "n": f"Tuyen {zname}", "z": zid, "b": branches[branch_code], "eff": effective_date}).lastrowid
            route_id[zcode] = rid

            if first_zone:
                sm_user_id, sm_emp_id = sale01_user_id, sale01_emp_id
                first_zone = False
            else:
                username = f"sale{salesman_seq:02d}"
                salesman_seq += 1
                sm_user_id, sm_emp_id = create_user_and_employee(username, f"{random_name()} ({rcode})", is_manager=False)

            route_salesman_user_id[zcode] = sm_user_id
            conn.execute(text("""
                INSERT INTO route_salesman_assignment (route_master_id, employee_id, effective_date)
                VALUES (:r, :e, :eff)
            """), {"r": rid, "e": sm_emp_id, "eff": effective_date})
            conn.execute(text("""
                INSERT INTO route_manager_assignment (route_master_id, employee_id, effective_date)
                VALUES (:r, :e, :eff)
            """), {"r": rid, "e": manager_employee_by_branch[branch_code], "eff": effective_date})
            print(f"  Tuyen {rcode} (vung {zname}) -> salesman uid={sm_user_id}, quan ly chi nhanh {branch_code}")

        # Chia khach hang trong tung chi nhanh vao 2 tuyen cua chi nhanh do (xen ke)
        for branch_code in ["CN-HCM", "CN-HN", "CN_DN"]:
            customers = conn.execute(text(
                "SELECT id FROM customer WHERE branch_id = :b ORDER BY id"
            ), {"b": branches[branch_code]}).fetchall()
            zcodes = [z for b, z, _ in ZONE_DEFS if b == branch_code]
            for i, (cust_id,) in enumerate(customers):
                target_zone = zcodes[i % 2]
                conn.execute(text("""
                    INSERT INTO route_master_outlet (route_master_id, customer_id, visit_order)
                    VALUES (:r, :c, :v)
                """), {"r": route_id[target_zone], "c": cust_id, "v": (i // 2) + 1})

        # Gan lai route_master_id/salesman_id cho TOAN BO don hang ban theo dung tuyen cua khach hang.
        # sales_order.salesman_id tham chieu user.id (khong phai employee.id) nen phai join qua employee
        # de lay dung user_id cua salesman dang phu trach tuyen do.
        conn.execute(text("""
            UPDATE sales_order so
            JOIN route_master_outlet rmo ON rmo.customer_id = so.customer_id
            JOIN route_salesman_assignment rsa ON rsa.route_master_id = rmo.route_master_id AND rsa.end_date IS NULL
            JOIN employee e ON e.id = rsa.employee_id
            SET so.route_master_id = rmo.route_master_id, so.salesman_id = e.user_id
        """))

        n_orders = conn.execute(text("SELECT COUNT(*) FROM sales_order WHERE salesman_id IS NOT NULL")).scalar()

    print(f"\nDa tao 6 vung ban hang, 6 tuyen, 6 salesman (1 tai su dung sale01), 3 quan ly vung.")
    print(f"Da gan route/salesman cho {n_orders} don hang ban.")
    print("Tiep theo: chay 'python ../etl/run_etl.py' de dong bo vao Data Warehouse.")


if __name__ == "__main__":
    main()
