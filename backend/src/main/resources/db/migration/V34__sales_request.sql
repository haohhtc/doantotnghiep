-- Tach lai "Yeu cau ban hang" (SR) thanh chung tu that, dung theo dung chuoi DMS goc: SR (nhan
-- vien di tuyen ghi tam, chua chot) -> chuyen thanh Don hang ban (SO, chinh thuc) -> DO -> Xac
-- nhan DO. Khac voi Don hang ban: SR KHONG bat buoc kho xuat (chua biet xuat kho nao luc ghi tam).
CREATE TABLE sales_request (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    customer_id BIGINT NOT NULL,
    remarks VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE sales_request_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sales_request_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (sales_request_id) REFERENCES sales_request(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id)
);

-- Truy vet don hang ban duoc tao ra tu yeu cau nao (nullable - don co the tao truc tiep, khong
-- qua Yeu cau ban hang, nhu truoc gio).
ALTER TABLE sales_order
    ADD COLUMN sales_request_id BIGINT NULL AFTER confirmed_by,
    ADD CONSTRAINT fk_sales_order_sales_request FOREIGN KEY (sales_request_id) REFERENCES sales_request(id);

INSERT INTO numbering_config (doc_type, prefix, current_sequence) VALUES
    ('SALES_REQUEST', 'SR', 0);
