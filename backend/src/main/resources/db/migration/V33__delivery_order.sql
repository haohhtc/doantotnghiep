-- Tach lai "Don giao hang" (DO) thanh chung tu that, doc lap voi Don hang ban (SO), dung theo
-- dung chuoi DMS goc: SO (duyet) -> DO (lenh giao, cho sua so luong giao thuc te) -> Xac nhan DO
-- (moi that su tru kho). SalesOrder.confirm() tu nay CHI duyet don, khong tru kho nua.
CREATE TABLE delivery_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    sales_order_id BIGINT NOT NULL UNIQUE,
    warehouse_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    remarks VARCHAR(500),
    created_by BIGINT NOT NULL,
    confirmed_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    FOREIGN KEY (sales_order_id) REFERENCES sales_order(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (created_by) REFERENCES user(id),
    FOREIGN KEY (confirmed_by) REFERENCES user(id)
);

CREATE TABLE delivery_order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    delivery_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    note VARCHAR(255),
    FOREIGN KEY (delivery_order_id) REFERENCES delivery_order(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id)
);

INSERT INTO numbering_config (doc_type, prefix, current_sequence) VALUES
    ('DELIVERY_ORDER', 'DO', 0);
