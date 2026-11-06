# AI-04 Chatbot - tra loi cau hoi tu nhien dua tren du lieu that trong Data Warehouse.
# Tu xay dung toan bo (xem nlp.py): nhan dien y dinh bang TF-IDF + Logistic Regression tu
# train, trich xuat thuc the (thoi gian/san pham/kho) bang doi chieu tu dien voi DW, roi query
# SQL that va dien so lieu vao cau tra loi mau - KHONG goi LLM/API ben thu 3 nao.
#
# Chay thu: uvicorn main:app --reload --port 8004
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import entities
import handlers
from db import get_dw_engine
from nlp import INTENTS, predict_intent

app = FastAPI(title="ERPQLKHO AI Chatbot", version="1.0")

# Goi truc tiep tu Frontend (khac origin voi Backend :8080) - xem docs/05-api-contract/api-endpoints.md
# "AI Services [BE2] - duoc Backend hoac Frontend goi truc tiep".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str
    # Role + chi nhanh (NPP) cua nguoi dang hoi - Frontend tu dien tu tai khoan dang dang nhap
    # (xem frontend/src/api/chatbotClient.js). Dung de CHAN truy cap chi nhanh khac - xem
    # PHAN QUYEN THEO CHI NHANH ben duoi. Optional de tuong thich nguoc voi api-contract goc
    # (chi co "question") khi test truc tiep qua curl/Postman - khi do coi nhu khong gioi han.
    role: str | None = None
    branchCode: str | None = None


SUGGESTED_QUESTIONS = [
    "Doanh thu tháng này là bao nhiêu?",
    "Doanh thu tháng này tăng hay giảm so với tháng trước?",
    "Sản phẩm nào bán chạy nhất?",
    "Sản phẩm nào sắp hết hàng?",
    "Tồn kho hiện tại theo từng kho?",
    "Sản phẩm nào bán chậm, tồn lâu?",
    "Danh mục sản phẩm nào doanh thu cao nhất?",
    "Tình hình nhập hàng tháng này?",
    "Nhà cung cấp nào nhập nhiều nhất?",
    "Khách hàng nào có doanh số thấp nhất, thuộc tuyến nào, SM nào phụ trách?",
]

# Cac intent "xep hang theo 1 chieu co dinh" - neu classifier chon 1 trong so nay nhung chieu
# nguoi dung THAT SU hoi (phat hien qua tu khoa, dang tin cay hon TF-IDF cho truong hop nay)
# lai KHAC chieu intent do ho tro, uu tien GENERIC_RANKING (dung dung chieu) hon la tra loi sai
# chieu nhung dung giong cau. Vd "giam sat nao doanh thu cao nhat" de bi TF-IDF nham thanh
# SALESMAN_PERFORMANCE (tu vung giong nhau) trong khi dimension that su la SUPERVISOR.
RANKING_INTENT_DIMENSION = {
    "TOP_SELLING": "PRODUCT", "SLOW_MOVING": "PRODUCT",
    "CUSTOMER_PERFORMANCE": "CUSTOMER", "SALESMAN_PERFORMANCE": "SALESMAN",
}

FALLBACK_ANSWER = (
    "Xin lỗi, tôi chưa hiểu rõ câu hỏi này. Bạn có thể hỏi về: doanh thu/doanh số bán hàng (kể cả "
    "so sánh tăng/giảm so với kỳ trước), sản phẩm bán chạy hoặc bán chậm, tồn kho hiện tại, sản "
    "phẩm sắp hết hàng, tình hình nhập hàng, nhà cung cấp, danh mục sản phẩm hoặc kênh bán hàng "
    "nào hiệu quả nhất, hoặc khách hàng/nhân viên bán hàng nào doanh số cao/thấp nhất (kèm tuyến, "
    "salesman phụ trách). Ví dụ: \"Doanh thu tháng này tăng hay giảm so với tháng trước?\""
)


def _access_denied_message(own_branch_name):
    return (f"Bạn không có quyền xem dữ liệu của chi nhánh/NPP khác. "
            f"Tài khoản của bạn chỉ được xem dữ liệu của {own_branch_name}.")


@app.get("/health")
def health():
    return {"status": "ok", "intents": INTENTS}


@app.get("/suggestions")
def suggestions():
    return {"questions": SUGGESTED_QUESTIONS}


@app.post("/chat")
def chat(req: ChatRequest):
    question = (req.question or "").strip()
    if not question:
        return {"answer": "Bạn hãy nhập câu hỏi nhé.", "sourceData": [], "intent": None, "confidence": 0.0}

    engine = get_dw_engine()
    intent, confidence = predict_intent(question)

    # Cau ngan nhu "doanh thu thang truoc" (chi neu TEN ky, khong co y so sanh) de bi TF-IDF
    # nham voi REVENUE_COMPARISON vi trung nhieu char n-gram voi cac cau mau dai hon - chi giu
    # REVENUE_COMPARISON khi cau THAT SU co ngon ngu so sanh, khong thi coi nhu REVENUE_TOTAL.
    if intent == "REVENUE_COMPARISON" and not entities.has_comparison_language(question):
        intent = "REVENUE_TOTAL"

    # Luoi an toan tong quat (xem entities.extract_dimension/handlers.handle_generic_ranking):
    # dung khi (a) khong intent cu the nao khop, HOAC (b) intent chon duoc la 1 trong nhom "xep
    # hang theo 1 chieu co dinh" nhung chieu tu khoa phat hien duoc lai KHAC chieu intent do ho
    # tro - uu tien tin tu khoa ro rang hon vi TF-IDF co the nham lan giua cac tu vung giong
    # nhau (vd "giam sat"/"nhan vien ban hang"). Khong dung lam "ghi de" cho cac intent khac
    # (STOCK_*/ROUTE_*/INBOUND_*/SUPPLIER_*) vi GENERIC_RANKING chi phu hop voi metric doanh
    # thu/so luong tren fact_sellout, khong thay the duoc logic rieng cua cac intent do.
    dimension = entities.extract_dimension(question)
    rank_language = entities.has_rank_language(question)
    expected_dim = RANKING_INTENT_DIMENSION.get(intent)
    should_use_generic = dimension and rank_language and (intent is None or (
        intent in RANKING_INTENT_DIMENSION and expected_dim != dimension
    ) or intent == "REVENUE_TOTAL")

    ref_date = entities.resolve_reference_date(engine)
    start, end, label = entities.extract_date_range(question, ref_date)
    product = entities.extract_product(question, engine)
    location = entities.extract_location(question, engine)

    # --- PHAN QUYEN THEO CHI NHANH (NPP) ---
    # ADMIN (Admin HO) khong gioi han - thay het moi chi nhanh. User khac (vd WAREHOUSE_MANAGER,
    # dong vai "NPP") CHI duoc xem du lieu CHI NHANH CUA CHINH HO: cau hoi khong noi ro chi nhanh
    # nao -> TU DONG gioi han ve chi nhanh ho (khong im lang tra loi toan he thong); cau hoi noi
    # ro 1 chi nhanh/kho thuoc chi nhanh KHAC -> TU CHOI thang, khong chay query (tranh lo du
    # lieu NPP khac). Dat SAU khi tinh location nhung TRUOC khi dispatch toi bat ky handler nao.
    is_restricted = bool(req.role) and req.role != "ADMIN" and bool(req.branchCode)
    if is_restricted:
        if location is None:
            location = {"scope": "branch", "branch_code": req.branchCode,
                        "branch_name": entities.get_branch_name(engine, req.branchCode)}
        elif location.get("branch_code") != req.branchCode:
            own_name = entities.get_branch_name(engine, req.branchCode)
            return {"answer": _access_denied_message(own_name), "sourceData": [],
                    "intent": intent, "confidence": confidence}

    if should_use_generic:
        metric = entities.extract_metric(question)
        direction = entities.extract_rank_direction(question)
        limit = entities.extract_limit(question, default=5)
        answer, source = handlers.handle_generic_ranking(
            engine, metric, dimension, start, end, label, direction, location, limit)
        return {"answer": answer, "sourceData": source, "intent": "GENERIC_RANKING", "confidence": confidence}

    if intent is None:
        return {"answer": FALLBACK_ANSWER, "sourceData": [], "intent": None, "confidence": confidence}

    if intent == "REVENUE_TOTAL":
        answer, source = handlers.handle_revenue_total(engine, start, end, label, product, location)
    elif intent == "REVENUE_COMPARISON":
        answer, source = handlers.handle_revenue_comparison(engine, start, end, label, location)
    elif intent == "TOP_SELLING":
        limit = entities.extract_limit(question, default=5)
        answer, source = handlers.handle_top_selling(engine, start, end, label, limit, location)
    elif intent == "SLOW_MOVING":
        limit = entities.extract_limit(question, default=5)
        answer, source = handlers.handle_slow_moving(engine, start, end, label, limit, location)
    elif intent == "STOCK_CURRENT":
        answer, source = handlers.handle_stock_current(engine, product, location)
    elif intent == "LOW_STOCK":
        answer, source = handlers.handle_low_stock(engine, ref_date, location)
    elif intent == "STOCK_BY_WAREHOUSE":
        answer, source = handlers.handle_stock_by_warehouse(engine, location, product)
    elif intent == "INBOUND_SUMMARY":
        answer, source = handlers.handle_inbound_summary(engine, start, end, label, location)
    elif intent == "SUPPLIER_ANALYSIS":
        answer, source = handlers.handle_supplier_analysis(engine, location)
    elif intent == "CUSTOMER_PERFORMANCE":
        direction = entities.extract_rank_direction(question)
        limit = entities.extract_limit(question, default=5)
        answer, source = handlers.handle_customer_performance(engine, start, end, label, direction, location, limit)
    elif intent == "PRODUCT_BY_ROUTE":
        direction = entities.extract_rank_direction(question, default="ASC")
        limit = entities.extract_limit(question, default=25)
        answer, source = handlers.handle_product_by_route(engine, start, end, label, direction, location, limit)
    elif intent == "ROUTE_COUNT":
        answer, source = handlers.handle_route_count(engine, location)
    elif intent == "ROUTE_SALESMAN_LOOKUP":
        route = entities.extract_route(question, engine)
        if is_restricted and route and route.get("branch_code") != req.branchCode:
            own_name = entities.get_branch_name(engine, req.branchCode)
            return {"answer": _access_denied_message(own_name), "sourceData": [],
                    "intent": intent, "confidence": confidence}
        answer, source = handlers.handle_route_salesman_lookup(engine, route)
    elif intent == "SALESMAN_PERFORMANCE":
        direction = entities.extract_rank_direction(question)
        limit = entities.extract_limit(question, default=5)
        answer, source = handlers.handle_salesman_performance(engine, start, end, label, direction, location, limit)
    else:
        answer, source = FALLBACK_ANSWER, []

    return {"answer": answer, "sourceData": source, "intent": intent, "confidence": round(confidence, 3)}
