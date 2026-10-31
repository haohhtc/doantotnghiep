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


SUGGESTED_QUESTIONS = [
    "Doanh thu tháng này là bao nhiêu?",
    "Sản phẩm nào bán chạy nhất?",
    "Sản phẩm nào sắp hết hàng?",
    "Tồn kho hiện tại theo từng kho?",
    "Sản phẩm nào bán chậm, tồn lâu?",
    "Tình hình nhập hàng tháng này?",
    "Nhà cung cấp nào nhập nhiều nhất?",
    "Khách hàng nào có doanh số thấp nhất, thuộc tuyến nào, SM nào phụ trách?",
]

FALLBACK_ANSWER = (
    "Xin lỗi, tôi chưa hiểu rõ câu hỏi này. Bạn có thể hỏi về: doanh thu/doanh số bán hàng, "
    "sản phẩm bán chạy hoặc bán chậm, tồn kho hiện tại, sản phẩm sắp hết hàng, tình hình nhập "
    "hàng, nhà cung cấp, hoặc khách hàng nào doanh số cao/thấp nhất (kèm tuyến, salesman phụ "
    "trách). Ví dụ: \"Sản phẩm nào sắp hết hàng?\""
)


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

    if intent is None:
        return {"answer": FALLBACK_ANSWER, "sourceData": [], "intent": None, "confidence": confidence}

    ref_date = entities.resolve_reference_date(engine)
    start, end, label = entities.extract_date_range(question, ref_date)
    product = entities.extract_product(question, engine)
    location = entities.extract_location(question, engine)

    if intent == "REVENUE_TOTAL":
        answer, source = handlers.handle_revenue_total(engine, start, end, label, product, location)
    elif intent == "TOP_SELLING":
        limit = entities.extract_limit(question, default=5)
        answer, source = handlers.handle_top_selling(engine, start, end, label, limit)
    elif intent == "SLOW_MOVING":
        limit = entities.extract_limit(question, default=5)
        answer, source = handlers.handle_slow_moving(engine, start, end, label, limit)
    elif intent == "STOCK_CURRENT":
        answer, source = handlers.handle_stock_current(engine, product, location)
    elif intent == "LOW_STOCK":
        answer, source = handlers.handle_low_stock(engine, ref_date, location)
    elif intent == "STOCK_BY_WAREHOUSE":
        answer, source = handlers.handle_stock_by_warehouse(engine, location, product)
    elif intent == "INBOUND_SUMMARY":
        answer, source = handlers.handle_inbound_summary(engine, start, end, label)
    elif intent == "SUPPLIER_ANALYSIS":
        answer, source = handlers.handle_supplier_analysis(engine)
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
        answer, source = handlers.handle_route_salesman_lookup(engine, route)
    else:
        answer, source = FALLBACK_ANSWER, []

    return {"answer": answer, "sourceData": source, "intent": intent, "confidence": round(confidence, 3)}
