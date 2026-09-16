-- V20: "Nhom san pham" that (M:N) - khac voi ProductCategory (nay da doi nhan hien thi thanh
-- "Thuoc tinh", van la FK 1-N nhu cu) - xem tonghop.md muc "Nhi dat hang lon" Nhom 3.

CREATE TABLE product_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE product_group_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_group_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_product_group_item (product_group_id, product_id),
    FOREIGN KEY (product_group_id) REFERENCES product_group(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);
