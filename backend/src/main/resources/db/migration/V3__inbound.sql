-- V3: Quan ly nhap hang (IN-01..IN-04)
-- Field dat ten tham khao theo UI that: Doc Number/Doc Date/Posting Date/Branch/Whse/Status/Remarks
-- xem ui-reference/02-nhap-hang/

CREATE TABLE goods_receipt (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    posting_date DATE,
    supplier_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    -- DRAFT: dang nhap lieu | CLOSED: da xac nhan, da cong ton kho
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    remarks VARCHAR(500),
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (supplier_id) REFERENCES supplier(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE goods_receipt_detail (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    goods_receipt_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipt(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);
