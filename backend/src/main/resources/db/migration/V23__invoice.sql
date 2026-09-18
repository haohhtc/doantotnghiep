-- V23: Invoices - xuat hoa don tu 1 Sales Order da CONFIRMED, chot cung thue tai thoi diem xuat.
-- KHONG dung gi den sales_order/sales_order_detail (giu nguyen pham vi da chot) - xem tonghop.md.

CREATE TABLE invoice (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    sales_order_id BIGINT NOT NULL UNIQUE,
    subtotal_amount DECIMAL(18,2) NOT NULL,
    tax_amount DECIMAL(18,2) NOT NULL,
    total_amount DECIMAL(18,2) NOT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sales_order_id) REFERENCES sales_order(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE invoice_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    line_tax_amount DECIMAL(18,2) NOT NULL,
    line_total DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoice(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);
