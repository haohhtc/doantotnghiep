# Ket noi toi Data Warehouse (erp_qlkho_dw) - service doc du lieu TU DW, khong doc OLTP
# (dung chuan kien truc da thong nhat, xem docs/02-architecture/system-architecture.md).
from pathlib import Path
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

_engine = None


def get_dw_engine():
    global _engine
    if _engine is None:
        url = (
            f"mysql+pymysql://{os.getenv('DW_DB_USER', 'erp_user')}:"
            f"{os.getenv('DW_DB_PASSWORD', 'erp_password')}@"
            f"{os.getenv('DW_DB_HOST', 'localhost')}:"
            f"{os.getenv('DW_DB_PORT', '3307')}/"
            f"{os.getenv('DW_DB_NAME', 'erp_qlkho_dw')}?charset=utf8mb4"
        )
        _engine = create_engine(url, pool_pre_ping=True)
    return _engine
