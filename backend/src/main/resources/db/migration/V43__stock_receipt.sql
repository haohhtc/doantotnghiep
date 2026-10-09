-- V43: Phieu nhap kho (Stock Receipt) - doc lap, KHONG qua Nha cung cap (khac "Nhap hang"/goods_receipt
-- da co, bat buoc Nha cung cap) - dung cho nhap kho noi bo/dieu chinh tang sau kiem ke/phat hien thua.
-- Doi xung voi Phieu xuat kho (goods_issue) nhung co them DVT + Don gia (giong sales_order_detail).

CREATE TABLE stock_receipt (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    posting_date DATE,
    warehouse_id BIGINT NOT NULL,
    -- ADJUST / FOUND / INTERNAL / OTHER - giu dang free-text nhu goods_issue.reason.
    reason VARCHAR(50) NOT NULL,
    remarks VARCHAR(500),
    -- DRAFT: dang nhap lieu | CLOSED: da xac nhan, da cong ton kho
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE stock_receipt_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stock_receipt_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    -- DVT cua dong (Goi/Hop/Thung) - de trong = don vi co so (he so 1), giong sales_order_detail.
    uom_id BIGINT NULL,
    base_quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (stock_receipt_id) REFERENCES stock_receipt(id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (uom_id) REFERENCES uom(id)
);

INSERT INTO numbering_config (doc_type, prefix, current_sequence) VALUES
    ('STOCK_RECEIPT', 'NK', 0);
