from pathlib import Path
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")


def _mysql_url(host, port, name, user, password):
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}?charset=utf8mb4"


def get_oltp_engine():
    url = _mysql_url(
        os.getenv("OLTP_DB_HOST", "localhost"),
        os.getenv("OLTP_DB_PORT", "3306"),
        os.getenv("OLTP_DB_NAME", "erp_qlkho_oltp"),
        os.getenv("OLTP_DB_USER", "erp_user"),
        os.getenv("OLTP_DB_PASSWORD", "erp_password"),
    )
    return create_engine(url)


def get_dw_engine():
    url = _mysql_url(
        os.getenv("DW_DB_HOST", "localhost"),
        os.getenv("DW_DB_PORT", "3307"),
        os.getenv("DW_DB_NAME", "erp_qlkho_dw"),
        os.getenv("DW_DB_USER", "erp_user"),
        os.getenv("DW_DB_PASSWORD", "erp_password"),
    )
    return create_engine(url)
