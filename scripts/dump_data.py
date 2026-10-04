"""Xuat TOAN BO du lieu (khong phai schema) cua OLTP va DW thanh file .sql (INSERT statements),
de dong doi up len git cho thanh vien khac IMPORT va co CUNG DU LIEU - khong dung mysqldump
(tranh lo password qua command line) ma doc qua ket noi SQLAlchemy co san (config/db_config.py).

CANH BAO: file .sql sinh ra se XOA SACH + GHI DE toan bo du lieu trong database dich khi import -
BAO TRUOC cho nguoi se import, dung chay nham vao database dang co du lieu quan trong.

CACH CHAY: cd scripts && python dump_data.py
CACH IMPORT (phia nguoi nhan): mysql -h 127.0.0.1 -P 3306 -u erp_user -p erp_qlkho_oltp < erp_qlkho_oltp_data.sql
                                mysql -h 127.0.0.1 -P 3307 -u erp_user -p erp_qlkho_dw   < erp_qlkho_dw_data.sql
"""
import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / "etl"))

from sqlalchemy import text
from config.db_config import get_oltp_engine, get_dw_engine

OUT_DIR = Path(__file__).resolve().parent.parent / "database-dump"

# Khong dump: chua credential/session - khong nen dua len git (user da co san qua Flyway,
# khong can dong bo qua dump nay).
SKIP_TABLES = {"flyway_schema_history", "user", "active_session", "login_log"}


def escape_value(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, float, Decimal)):
        return str(v)
    if isinstance(v, (date, datetime)):
        return f"'{v}'"
    s = str(v).replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"


def dump_database(engine, db_name, out_file):
    with engine.connect() as conn:
        tables = [r[0] for r in conn.execute(text(
            "SELECT TABLE_NAME FROM information_schema.TABLES "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
        )).fetchall()]

        with open(out_file, "w", encoding="utf-8") as f:
            f.write(f"-- Data dump cua database '{db_name}' - sinh tu dump_data.py, chi co DU LIEU (khong co schema).\n")
            f.write("-- CANH BAO: import file nay se XOA SACH du lieu hien co trong tung bang truoc khi nap lai.\n")
            f.write("-- Chay Flyway (OLTP) / cac file data-warehouse/schema/*.sql (DW) truoc de co du bang.\n\n")
            f.write("SET FOREIGN_KEY_CHECKS=0;\n\n")

            total_rows = 0
            for t in tables:
                if t in SKIP_TABLES:
                    continue
                rows = conn.execute(text(f"SELECT * FROM {t}")).mappings().all()
                f.write(f"DELETE FROM {t};\n")
                if rows:
                    cols = list(rows[0].keys())
                    col_list = ", ".join(f"`{c}`" for c in cols)
                    f.write(f"INSERT INTO {t} ({col_list}) VALUES\n")
                    value_lines = []
                    for row in rows:
                        values = ", ".join(escape_value(row[c]) for c in cols)
                        value_lines.append(f"  ({values})")
                    f.write(",\n".join(value_lines))
                    f.write(";\n")
                f.write("\n")
                total_rows += len(rows)
                print(f"  {t}: {len(rows)} dong")

            f.write("SET FOREIGN_KEY_CHECKS=1;\n")

    return total_rows


def main():
    OUT_DIR.mkdir(exist_ok=True)

    print("=== Dump OLTP (erp_qlkho_oltp) ===")
    oltp_rows = dump_database(get_oltp_engine(), "erp_qlkho_oltp", OUT_DIR / "erp_qlkho_oltp_data.sql")

    print("\n=== Dump Data Warehouse (erp_qlkho_dw) ===")
    dw_rows = dump_database(get_dw_engine(), "erp_qlkho_dw", OUT_DIR / "erp_qlkho_dw_data.sql")

    print(f"\nXong! OLTP: {oltp_rows} dong, DW: {dw_rows} dong.")
    print(f"File luu tai: {OUT_DIR}")


if __name__ == "__main__":
    main()
