# Module: Product (Sản phẩm)

Chức năng: CAT-01 trong `docs/01-requirements/functional-requirements.md`. Thiết kế bảng: `docs/03-database/erd-oltp.md`.

Cấu trúc cần code (theo đúng pattern đã làm mẫu ở `auth/` + `user/`):

- `entity/Product.java` — extends `BaseEntity`, field: code, name, categoryId (ManyToOne → ProductCategory), unit, price, description, status
- `repository/ProductRepository.java` — `extends JpaRepository<Product, Long>`
- `service/ProductService.java` — CRUD, validate trùng code
- `controller/ProductController.java` — REST endpoint theo `docs/05-api-contract/api-endpoints.md`
- `dto/ProductDto.java` — request/response shape

Nhớ thêm bảng `product` vào migration mới (`db/migration/V2__...sql`), không sửa `V1__init_schema.sql` đã chạy.
