"""Gan region/province/district/ward (da nhap boi seed_geography.py) cho 3 branch hien co
va 40 customer hien co. Chay sau seed_geography.py, 1 lan."""
import random
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import os

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")
random.seed(7)


def env(key, default=None):
    return os.getenv(key, default)


def build_engine():
    user = env("OLTP_DB_USER", "erp_user")
    pwd = env("OLTP_DB_PASSWORD", "erp_password")
    host = env("OLTP_DB_HOST", "localhost")
    port = env("OLTP_DB_PORT", "3306")
    name = env("OLTP_DB_NAME", "erp_qlkho_oltp")
    return create_engine(f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{name}?charset=utf8mb4")

# Chi nhanh -> phuong trung tam cua tinh/thanh do (phuong, ma branch)
BRANCH_CENTRAL_WARD = {
    "CN-HCM": "Phuong Ben Thanh",
    "CN-HN": "Phuong Hoan Kiem",
    "CN_DN": "Phuong Hai Chau",
}

# Phan bo 40 khach hang theo ti trong (HCM la dau moi chinh, dong khach hang nhat)
CUSTOMER_CITY_WEIGHTS = {"TP_HCM": 20, "TP_HN": 12, "TP_DN": 8}
PROVINCE_CODE_MAP = {"TP_HCM": "HCM", "TP_HN": "HN", "TP_DN": "DN"}


def main():
    engine = build_engine()
    with engine.begin() as conn:
        ward_full = conn.execute(text("""
            SELECT w.id AS ward_id, w.name AS ward_name, w.district_id,
                   d.province_id, p.region_id, p.code AS province_code
            FROM ward w
            JOIN district d ON d.id = w.district_id
            JOIN province p ON p.id = d.province_id
        """)).mappings().all()
        if not ward_full:
            raise SystemExit("Bang 'ward' dang rong - chay seed_geography.py truoc.")

        by_province = {}
        for row in ward_full:
            by_province.setdefault(row["province_code"], []).append(row)

        # --- 1. Gan 3 branch vao phuong trung tam ---
        for branch_code, ward_name in BRANCH_CENTRAL_WARD.items():
            row = next(r for r in ward_full if r["ward_name"] == ward_name)
            conn.execute(text("""
                UPDATE branch SET region_id=:r, province_id=:p, district_id=:d, ward_id=:w
                WHERE code=:code
            """), {"r": row["region_id"], "p": row["province_id"], "d": row["district_id"],
                    "w": row["ward_id"], "code": branch_code})
            print(f"  branch {branch_code} -> {ward_name}")

        # --- 2. Gan 40 customer, phan bo theo ti trong 3 thanh pho, random phuong/xa trong tung tp ---
        customers = conn.execute(text("SELECT id, code, name, address FROM customer ORDER BY id")).mappings().all()

        plan = []
        for city, weight in CUSTOMER_CITY_WEIGHTS.items():
            plan += [city] * weight
        random.shuffle(plan)

        for cust, city in zip(customers, plan):
            province_code = PROVINCE_CODE_MAP[city]
            ward_row = random.choice(by_province[province_code])
            conn.execute(text("""
                UPDATE customer SET region_id=:r, province_id=:p, district_id=:d, ward_id=:w
                WHERE id=:id
            """), {"r": ward_row["region_id"], "p": ward_row["province_id"], "d": ward_row["district_id"],
                    "w": ward_row["ward_id"], "id": cust["id"]})
            print(f"  {cust['code']} ({cust['name']}) -> {ward_row['ward_name']}")

    print(f"\nDa gan geography cho {len(BRANCH_CENTRAL_WARD)} branch va {len(customers)} customer.")


if __name__ == "__main__":
    main()
