# AI Services

4 service Python (FastAPI) độc lập, mỗi service 1 port riêng — đọc dữ liệu từ **Data Warehouse**, không đọc trực tiếp OLTP.

| Service | Port | Chức năng |
|---|---|---|
| `forecasting/` | 8001 | AI-01 — Dự báo nhu cầu sản phẩm |
| `stock-risk/` | 8002 | AI-02 — Đánh giá nguy cơ thiếu hàng |
| `anomaly-detection/` | 8003 | AI-03 — Phát hiện bất thường |
| `chatbot/` | 8004 | AI-04 — AI Chatbot hỏi-đáp |

Mỗi folder hiện chỉ có `requirements.txt` + `main.py` placeholder — tự code FastAPI app vào đó.

Chi tiết input/output từng API: [`../docs/05-api-contract/api-endpoints.md`](../docs/05-api-contract/api-endpoints.md)

## Chạy thử 1 service (sau khi code xong)

```bash
cd forecasting
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```
