# Backend — ERP Quản Lý Kho Thông Minh

Java 17 + Spring Boot 3 + Spring Data JPA + Spring Security (JWT) + Flyway + MySQL.

## Trạng thái scaffold

| Module | Trạng thái |
|---|---|
| `config/`, `common/` | Đã dựng (CORS, Security filter chain, OpenAPI/Swagger, exception handler, response wrapper, base entity) |
| `auth/`, `user/` | **Đã code đầy đủ** — dùng làm ví dụ mẫu (login JWT, CRUD user, phân quyền theo Role) |
| `category/product`, `category/productcategory`, `category/supplier`, `category/warehouse` | Khung thư mục — xem README trong từng folder |
| `inbound/`, `sales/`, `inventory/` | Khung thư mục — xem README trong từng folder |

## Chạy thử

```bash
docker compose up -d          # ở thư mục gốc project, khởi động MySQL
mvn spring-boot:run           # http://localhost:8080, Swagger: /swagger-ui.html
```

Test đăng nhập mẫu: cần tự tạo 1 user qua `INSERT` (role ADMIN đã seed sẵn ở `V1__init_schema.sql`) vì chưa có màn hình đăng ký — mật khẩu phải là BCrypt hash.

## Thêm module mới

1. Tạo package theo domain (giống `category/product/`)
2. Tạo `entity/`, `repository/`, `service/`, `controller/`, `dto/` bên trong — theo đúng cách tổ chức của `auth/` và `user/`
3. Thêm bảng vào migration mới `db/migration/V{n}__...sql` (không sửa file V1 đã chạy)
4. Cập nhật `docs/05-api-contract/api-endpoints.md` nếu thêm/đổi endpoint
