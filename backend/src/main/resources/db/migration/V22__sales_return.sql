-- V22: Sales Order Returns (gop Return Request + Returns thanh 1 buoc) - xem tonghop.md muc
-- "Sales Order - tai cau truc Sidebar + Returns".

CREATE TABLE sales_return (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    customer_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    sales_order_id BIGINT NULL,
    reason VARCHAR(255),
    remarks VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (sales_order_id) REFERENCES sales_order(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE sales_return_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sales_return_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    note VARCHAR(255),
    FOREIGN KEY (sales_return_id) REFERENCES sales_return(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);
