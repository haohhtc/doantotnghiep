# AI-04 Chatbot - trich xuat THUC THE (entity) tu cau hoi: khoang ngay, san pham, kho/chi nhanh.
# Tu xay bang tu dien (dictionary matching) doi chieu voi du lieu that trong DW - khong can
# model rieng cho buoc nay, phu hop quy mo cau hoi nghiep vu co cau truc cua do an.
import re
from datetime import date, timedelta

from sqlalchemy import text as sql_text

from nlp import normalize


def resolve_reference_date(engine):
    """'Hom nay' cua chatbot = ngay gan nhat THAT SU co du lieu ban hang trong DW, khong phai
    ngay thuc te tren may (du lieu seed dang dung trong 1 khoang qua khu co dinh)."""
    with engine.connect() as conn:
        row = conn.execute(sql_text(
            "SELECT MAX(td.full_date) FROM fact_sellout f JOIN dim_time td ON td.time_key = f.time_key"
        )).fetchone()
    return row[0] if row and row[0] else date.today()


def extract_date_range(question: str, ref_date: date):
    """Doc cac cum tu chi thoi gian trong cau hoi, tra ve (start_date, end_date, label_vn).
    Khong nhan dien duoc -> mac dinh 30 ngay gan nhat tinh den ref_date."""
    q = normalize(question)

    m = re.search(r"(\d+)\s*ngay", q)
    if m:
        n = int(m.group(1))
        return ref_date - timedelta(days=n - 1), ref_date, f"{n} ngay qua"

    m = re.search(r"(\d+)\s*thang", q)
    if m:
        n = int(m.group(1))
        start = (ref_date.replace(day=1) - timedelta(days=1))
        for _ in range(n - 1):
            start = (start.replace(day=1) - timedelta(days=1))
        start = start.replace(day=1)
        return start, ref_date, f"{n} thang qua"

    if "hom nay" in q:
        return ref_date, ref_date, "hom nay"
    if "hom qua" in q:
        d = ref_date - timedelta(days=1)
        return d, d, "hom qua"
    if "tuan truoc" in q or "tuan qua" in q:
        this_monday = ref_date - timedelta(days=ref_date.weekday())
        last_monday = this_monday - timedelta(days=7)
        return last_monday, last_monday + timedelta(days=6), "tuan truoc"
    if "tuan nay" in q:
        this_monday = ref_date - timedelta(days=ref_date.weekday())
        return this_monday, ref_date, "tuan nay"
    if "thang truoc" in q:
        first_this_month = ref_date.replace(day=1)
        last_day_prev = first_this_month - timedelta(days=1)
        first_prev = last_day_prev.replace(day=1)
        return first_prev, last_day_prev, "thang truoc"
    if "thang nay" in q:
        return ref_date.replace(day=1), ref_date, "thang nay"
    if "quy nay" in q:
        quarter_start_month = (ref_date.month - 1) // 3 * 3 + 1
        return date(ref_date.year, quarter_start_month, 1), ref_date, "quy nay"
    if "nam nay" in q:
        return date(ref_date.year, 1, 1), ref_date, "nam nay"

    return ref_date - timedelta(days=29), ref_date, "30 ngay gan day"


def extract_product(question: str, engine):
    """Khop ten/ma san pham trong cau hoi voi dim_product (so khop chuoi con, khong dau).
    Tra ve dict {product_code, product_name} hoac None neu khong nhac toi san pham cu the."""
    q = normalize(question)
    with engine.connect() as conn:
        rows = conn.execute(sql_text(
            "SELECT DISTINCT product_code, product_name FROM dim_product"
        )).fetchall()

    best = None
    for code, name in rows:
        name_norm = normalize(name)
        code_norm = normalize(code)
        if code_norm and code_norm in q:
            return {"product_code": code, "product_name": name}
        if name_norm and name_norm in q:
            return {"product_code": code, "product_name": name}
        # Khop theo tung tu chinh cua ten SP (vd "chocopie", "custas") de khong bat buoc go dung
        # het ten day du.
        keywords = [w for w in name_norm.split() if len(w) >= 5]
        if keywords and all(kw in q for kw in keywords[:2]):
            best = best or {"product_code": code, "product_name": name}
    return best


def extract_warehouse(question: str, engine):
    """Khop ten kho/chi nhanh trong cau hoi voi dim_warehouse."""
    q = normalize(question)
    with engine.connect() as conn:
        rows = conn.execute(sql_text(
            "SELECT DISTINCT warehouse_code, warehouse_name, branch_name FROM dim_warehouse"
        )).fetchall()

    for code, name, branch_name in rows:
        if normalize(code) in q or normalize(name) in q:
            return {"warehouse_code": code, "warehouse_name": name}
        if branch_name and normalize(branch_name) in q:
            return {"warehouse_code": code, "warehouse_name": name}
    return None
