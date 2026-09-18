-- V24: Purchase Order - Goods Return (tra hang NCC), gop Goods Return Request + Confirm thanh 1
-- buoc, tai dung y het pattern Goods Issue - xem tonghop.md muc "Purchase Order".

CREATE TABLE purchase_return (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    posting_date DATE,
    supplier_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    goods_receipt_id BIGINT NULL,
    reason VARCHAR(255),
    remarks VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (supplier_id) REFERENCES supplier(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipt(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE purchase_return_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_return_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    note VARCHAR(255),
    FOREIGN KEY (purchase_return_id) REFERENCES purchase_return(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);
