# Quy trình Git

## Branching

```
main                    ← code luôn chạy được, dùng để demo/bảo vệ
 └─ dev                 ← nhánh tích hợp, merge vào đây trước khi merge lên main
     ├─ feature/be-auth              (Thành viên 1)
     ├─ feature/be-product-crud      (Thành viên 1)
     ├─ feature/fe-product-page      (Thành viên 1)
     ├─ feature/etl-extract          (Thành viên 2)
     ├─ feature/dw-schema            (Thành viên 2)
     └─ feature/ai-forecasting       (Thành viên 2)
```

- Đặt tên nhánh: `feature/<khu-vực>-<mô-tả-ngắn>` (vd: `feature/be-goods-receipt`), `fix/<mô-tả>` cho sửa lỗi.
- Không code trực tiếp trên `main` hoặc `dev`.
- Tạo Pull Request từ `feature/*` → `dev`, người còn lại review trước khi merge (kể cả nhóm 2 người vẫn nên review chéo — bắt lỗi sớm, cả 2 đều hiểu code của nhau để bảo vệ đồ án).
- Định kỳ (cuối mỗi tuần) merge `dev` → `main` khi mọi thứ chạy ổn định.

## Commit message

Theo [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<phạm vi>): <mô tả ngắn>

feat(backend): thêm CRUD Product
fix(etl): sửa lỗi extract thiếu bản ghi mới nhất
docs(readme): cập nhật hướng dẫn chạy local
refactor(frontend): tách component DataTable dùng chung
```

Loại (`type`) thường dùng: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

## Quy tắc tránh xung đột giữa 2 thành viên

- Thành viên 1 chỉ commit trong `backend/`, `frontend/`.
- Thành viên 2 chỉ commit trong `etl/`, `data-warehouse/`, `ai-services/`, `bi/`.
- File dùng chung (`docs/`, `README.md`, `docker-compose.yml`) — báo trước trong nhóm chat trước khi sửa, hoặc sửa qua Pull Request nhỏ để người kia review.
- Không commit file `.env`, dữ liệu thật của doanh nghiệp khảo sát (nếu có) — đã chặn qua `.gitignore`.
