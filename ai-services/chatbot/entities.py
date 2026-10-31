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


# Noi tat/alias pho bien cho 3 chi nhanh - can co vi branch_name day du ("Chi nhanh TP.HCM")
# thuong KHONG xuat hien y nguyen trong cau hoi that (nguoi dung hay go tat "o HCM", "ben Ha Noi").
BRANCH_ALIASES = {
    "CN-HCM": ["tp.hcm", "tphcm", "ho chi minh", "sai gon", "hcm"],
    "CN-HN": ["ha noi", "thu do", "hn"],
    "CN_DN": ["da nang", "dn"],
}

# Noi tat loai kho (dung dung thuat ngu nghiep vu Main/Van da dung trong he thong - xem
# V37/V38: mo hinh kho 2 cap Main (kho tong) -> Van (kho luu dong tren xe tai ban hang)).
WAREHOUSE_TYPE_KEYWORDS = {
    "MAIN": ["kho main", "kho chinh", "kho tong", "main"],
    "VAN": ["kho van", "luu dong", "xe tai", "van"],
    "DAMAGE": ["kho loi", "hang loi", "damage"],
}


def extract_location(question: str, engine):
    """Nhan dien pham vi KHO/CHI NHANH nhac toi trong cau hoi. Tra ve None neu khong nhac gi,
    hoac 1 trong 2 dang:
      - {"scope": "warehouse", "warehouse_code", "warehouse_name"} - dung 1 kho cu the (go dung
        ten/ma kho, hoac chi nhanh + loai kho MAIN/VAN/DAMAGE ma chi khop dung 1 kho).
      - {"scope": "branch", "branch_code", "branch_name"} - ca chi nhanh (nhieu kho, vd CN-HCM co
        ca kho Main va kho Van) - cac ham xu ly se CONG DON tat ca kho thuoc chi nhanh nay.
    Quan trong: khong duoc tu y gop ton kho giua cac chi nhanh/kho khac nhau khi nguoi dung hoi
    cu the 1 noi - 1 NVBH/kho o chi nhanh nay khong the "muon" hang tu kho chi nhanh khac."""
    q = normalize(question)
    with engine.connect() as conn:
        rows = conn.execute(sql_text(
            "SELECT warehouse_code, warehouse_name, warehouse_type, branch_code, branch_name FROM dim_warehouse"
        )).fetchall()

    # 1) Go dung ten/ma 1 kho cu the - uu tien cao nhat, ro rang nhat, khong can suy luan gi them.
    for r in rows:
        if normalize(r.warehouse_code) in q or normalize(r.warehouse_name) in q:
            return {"scope": "warehouse", "warehouse_code": r.warehouse_code, "warehouse_name": r.warehouse_name}

    # 2) Nhac toi chi nhanh (ten day du hoac alias thong dung)
    branch_code = None
    for bcode, aliases in BRANCH_ALIASES.items():
        if any(a in q for a in aliases):
            branch_code = bcode
            break
    if not branch_code:
        return None

    branch_warehouses = [r for r in rows if r.branch_code == branch_code]
    if not branch_warehouses:
        return None
    branch_name = branch_warehouses[0].branch_name

    # 3) Co nhac them loai kho (Main/Van/kho loi) va chi nhanh nay chi co DUNG 1 kho loai do
    # -> quy ve thang 1 kho cu the, khong can cong don ca chi nhanh.
    for wtype, keywords in WAREHOUSE_TYPE_KEYWORDS.items():
        if any(kw in q for kw in keywords):
            matched = [r for r in branch_warehouses if r.warehouse_type == wtype]
            if len(matched) == 1:
                return {"scope": "warehouse", "warehouse_code": matched[0].warehouse_code,
                        "warehouse_name": matched[0].warehouse_name}
            break

    return {"scope": "branch", "branch_code": branch_code, "branch_name": branch_name}


_LOW_RANK_KEYWORDS = ["thap nhat", "it nhat", "kem nhat", "yeu nhat", "can cham soc", "cham nhat",
                       "ton lau", "can day manh", "can thuc day"]
_HIGH_RANK_KEYWORDS = ["cao nhat", "nhieu nhat", "tot nhat", "hieu qua nhat", "lon nhat",
                        "dong gop nhieu", "chay nhat", "ban chay"]


def extract_limit(question: str, default=5, max_limit=20):
    """Cau hoi co 'top N'/'N khach hang'/'N san pham' - lay so N lam gioi han danh sach, bo qua
    cac so da bi dung lam khoang thoi gian (vd '7 ngay qua') de khong nham."""
    q = normalize(question)
    q_no_time = re.sub(r"\d+\s*(ngay|thang|tuan|nam|quy)\b", "", q)
    m = re.search(r"\btop\s*(\d+)\b", q_no_time) or re.search(r"\b(\d+)\s*(khach hang|san pham|sp|kh)\b", q_no_time)
    if m:
        n = int(m.group(1))
        if 1 <= n <= max_limit:
            return n
    return default


def extract_rank_direction(question: str, default="DESC"):
    """Cau hoi xep hang (KH/SP nao thap nhat/cao nhat...) - tra ve 'ASC' (thap->cao, lay dau la
    thap nhat) hoac 'DESC' (cao->thap, lay dau la cao nhat)."""
    q = normalize(question)
    if any(k in q for k in _LOW_RANK_KEYWORDS):
        return "ASC"
    if any(k in q for k in _HIGH_RANK_KEYWORDS):
        return "DESC"
    return default


def location_label(location):
    """Cum tu tieng Viet mo ta pham vi, de dien vao cau tra loi (vd ' tai Kho Tong TP.HCM')."""
    if not location:
        return ""
    if location["scope"] == "warehouse":
        return f' tại {location["warehouse_name"]}'
    if location["scope"] == "branch":
        return f' tại {location["branch_name"]} (tất cả kho)'
    return ""
