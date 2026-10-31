# AI-04 Chatbot - lop nhan dien Y DINH cau hoi (intent classification).
# Tu xay dung bang scikit-learn (TF-IDF ky tu + Logistic Regression) - KHONG goi LLM/API cua
# ben thu 3 nao de "hieu" cau hoi, dung dung yeu cau cua GVHD la phai tu lam phan AI.
#
# Vi sao dung TF-IDF theo KY TU (char n-gram) thay vi theo TU: tieng Viet co dau + nguoi dung
# hay go thieu dau/sai chinh ta ("ban chay", "sap het hang", "doanh thu thang nay"...), char
# n-gram "nhin thay" cac mau chu con (vd "ban chay", "het hang") du cau bi bien the nhe, khong
# can bo tokenizer tieng Viet rieng (underthesea/pyvi) de giu pipeline don gian, tu code duoc
# toan bo.
#
# Mo hinh duoc HUAN LUYEN LAI MOI LAN SERVICE KHOI DONG tu tap cau hoi mau (TRAINING_EXAMPLES)
# ben duoi - khong luu file .pkl - de luon khop voi tap intent dang ho tro va de giai trinh
# ("mo hinh nay duoc train tu dau, bang du lieu gi" la cau tra loi ro rang cho hoi dong).

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import unicodedata

# --- Cac Y DINH (intent) chatbot ho tro - moi intent ung voi 1 nhom cau hoi nghiep vu that,
# bam theo dung 8 dashboard Power BI (xem bi/README.md) de chatbot "noi duoc" nhung gi dashboard
# da the hien, bang ngon ngu tu nhien.
INTENTS = [
    "REVENUE_TOTAL",      # Tong doanh thu / doanh so ban hang theo thoi gian
    "TOP_SELLING",        # San pham ban chay nhat
    "SLOW_MOVING",        # San pham ban cham / ton lau
    "STOCK_CURRENT",      # Ton kho hien tai cua 1 san pham
    "LOW_STOCK",          # San pham sap het hang / can nhap them
    "STOCK_BY_WAREHOUSE", # Ton kho theo tung kho / chi nhanh
    "INBOUND_SUMMARY",    # Tinh hinh nhap hang
    "SUPPLIER_ANALYSIS",  # Phan tich nha cung cap
    "OTHER",              # Ngoai pham vi nghiep vu (chao hoi, cau hoi khong lien quan...) - lop
                           # "tu choi" de khong ep cau hoi khong lien quan vao 1 trong 8 intent that
]

TRAINING_EXAMPLES = {
    "REVENUE_TOTAL": [
        "doanh thu thang nay la bao nhieu",
        "doanh so ban hang tuan nay",
        "tong doanh thu hom nay",
        "doanh thu hom qua the nao",
        "ban duoc bao nhieu tien thang truoc",
        "tong doanh so 7 ngay qua",
        "doanh thu quy nay",
        "cho toi xem doanh thu ban hang",
        "tong tien ban hang 30 ngay gan day",
        "thang nay ban duoc bao nhieu don",
        "doanh thu chi nhanh hcm thang nay",
        "doanh so ban hang nam nay",
        "so luong don hang va doanh thu tuan nay",
        "tinh hinh ban hang gan day the nao",
        "ket qua kinh doanh thang nay ra sao",
    ],
    "TOP_SELLING": [
        "san pham nao ban chay nhat",
        "top san pham ban chay",
        "san pham ban chay nhat thang nay",
        "mat hang nao ban nhieu nhat",
        "top 5 san pham ban chay",
        "san pham nao duoc mua nhieu nhat",
        "cho toi danh sach san pham ban chay",
        "san pham ban tot nhat la gi",
        "thang nay san pham nao hot nhat",
        "xep hang san pham theo doanh so",
        "san pham ban chay nhat tuan qua",
        "top 10 mat hang ban chay",
    ],
    "SLOW_MOVING": [
        "san pham nao ban cham",
        "san pham ton lau khong ban duoc",
        "mat hang nao it nguoi mua",
        "san pham ban cham nhat",
        "hang nao ton kho lau ngay",
        "san pham nao khong ai mua",
        "danh sach san pham ban cham",
        "san pham ton kho lau khong xuat ban",
        "mat hang nao ban yeu nhat",
        "san pham it duoc dat hang nhat",
    ],
    "STOCK_CURRENT": [
        "ton kho hien tai cua san pham nay la bao nhieu",
        "con bao nhieu hang trong kho",
        "kiem tra ton kho san pham",
        "ton kho hien tai the nao",
        "so luong ton kho bay gio",
        "hang nay con ton bao nhieu",
        "ton kho san pham banh chocopie",
        "cho toi xem ton kho hien tai",
        "kho con bao nhieu san pham nay",
        "ton kho hom nay cua tat ca san pham",
    ],
    "LOW_STOCK": [
        "san pham nao sap het hang",
        "canh bao ton kho thap",
        "mat hang nao can nhap gap",
        "san pham nao sap can kho",
        "danh sach san pham sap het",
        "hang nao dang thieu can nhap them",
        "co san pham nao nguy co het hang khong",
        "kiem tra canh bao sap het hang",
        "san pham nao ton kho dang thap",
        "can nhap them san pham nao gap",
    ],
    "STOCK_BY_WAREHOUSE": [
        "ton kho theo tung kho the nao",
        "kho nao dang ton nhieu hang nhat",
        "so sanh ton kho giua cac kho",
        "ton kho chi nhanh hcm bao nhieu",
        "kho van con bao nhieu hang",
        "ton kho tung chi nhanh ra sao",
        "kho nao it hang nhat",
        "cho toi xem ton kho theo kho",
        "ton kho o kho chinh con bao nhieu",
        "ton kho hien tai theo tung kho",
        "ton kho hien tai cua tung kho the nao",
        "ton kho hien tai phan theo kho",
    ],
    "INBOUND_SUMMARY": [
        "tinh hinh nhap hang thang nay",
        "da nhap bao nhieu hang tuan nay",
        "so luong nhap kho gan day",
        "nhap hang hom nay nhu the nao",
        "tong gia tri nhap hang thang truoc",
        "da nhap nhung san pham nao gan day",
        "bao cao nhap hang thang nay",
        "nhap kho tuan qua duoc bao nhieu",
    ],
    "SUPPLIER_ANALYSIS": [
        "nha cung cap nao nhap nhieu nhat",
        "phan tich nha cung cap",
        "ncc nao cung cap nhieu hang nhat",
        "gia tri nhap hang theo nha cung cap",
        "nha cung cap nao dang hop tac nhieu nhat",
        "thong ke theo nha cung cap",
        "nha cung cap chu luc la ai",
    ],
    "OTHER": [
        "xin chao",
        "chao ban",
        "ban la ai",
        "ban ten gi",
        "hom nay troi dep khong",
        "thoi tiet hom nay the nao",
        "ban co khoe khong",
        "cam on ban nhe",
        "ban co the lam gi",
        "1 cong 1 bang may",
        "ke cho toi 1 cau chuyen cuoi",
        "gio bay gio la may gio",
        "toi muon dat ve may bay",
        "cong ty minh o dau",
        "homnay la thu may",
        "ban khoe khong",
        "toi ten la gi",
        "hat cho toi 1 bai hat",
    ],
}


def _strip_accents(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def normalize(text: str) -> str:
    """Chuan hoa cau hoi: ha chu thuong, bo dau tieng Viet, gon khoang trang -
    giup khop tot hon voi entity (ten SP/kho khong dau) va giam nhieu cho TF-IDF."""
    text = _strip_accents(text.lower())
    return " ".join(text.split())


def _build_classifier():
    texts, labels = [], []
    for intent, examples in TRAINING_EXAMPLES.items():
        for ex in examples:
            texts.append(normalize(ex))
            labels.append(intent)

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4), min_df=1)),
        ("clf", LogisticRegression(max_iter=1000, C=5.0)),
    ])
    pipeline.fit(texts, labels)
    return pipeline


_classifier = _build_classifier()

# Duoi nguong nay coi nhu khong chac chan -> tra loi fallback thay vi doan bua.
CONFIDENCE_THRESHOLD = 0.35


def predict_intent(question: str):
    """Tra ve (intent, confidence). intent=None neu khong du tin cay hoac la cau hoi
    ngoai pham vi (lop OTHER)."""
    norm = normalize(question)
    probs = _classifier.predict_proba([norm])[0]
    classes = _classifier.classes_
    best_idx = probs.argmax()
    best_intent, best_conf = classes[best_idx], float(probs[best_idx])
    if best_intent == "OTHER" or best_conf < CONFIDENCE_THRESHOLD:
        return None, best_conf
    return best_intent, best_conf
