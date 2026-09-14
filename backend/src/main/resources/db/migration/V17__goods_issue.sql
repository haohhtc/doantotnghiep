-- V17: Phieu xuat kho (Goods Issue) - man hinh doc lap thuc su trong DMS that (xem
-- ui-reference/04-ton-kho/phieu-xuat-goodsissue*.png), khong gop vao Sales Order.

CREATE TABLE goods_issue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    posting_date DATE,
    warehouse_id BIGINT NOT NULL,
    -- SALE / DAMAGE / INTERNAL / ADJUST - giu dang free-text nhu he thong that (khong tach bang rieng).
    reason VARCHAR(50) NOT NULL,
    remarks VARCHAR(500),
    -- DRAFT: dang nhap lieu | CLOSED: da xac nhan, da tru ton kho
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE goods_issue_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    goods_issue_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    batch VARCHAR(100),
    note VARCHAR(255),
    FOREIGN KEY (goods_issue_id) REFERENCES goods_issue(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);
