-- Yeu cau mua hang (Purchase Request) - buoc ghi truoc Phieu nhap hang (Goods Receipt), dung theo
-- dung pattern da co cua Yeu cau ban hang (SR) ben Sales: OPEN (dang sua) -> PENDING_APPROVAL (gui
-- duyet, khoa sua) -> CLOSED (da chuyen thanh Phieu nhap hang that, DRAFT). Khong dung gi den ton
-- kho o buoc nay - chi khi Phieu nhap hang duoc Xac nhan (rieng, o trang Nhap hang) moi cong kho.
-- Khong co DVT quy doi (giong het Goods Receipt hien tai - quantity la don vi co so).
CREATE TABLE purchase_request (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    request_date DATE NOT NULL,
    posting_date DATE NULL,
    supplier_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    reason VARCHAR(500),
    remarks VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    subtotal_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    -- Truy vet da chuyen thanh Phieu nhap hang nao (nullable - chi co sau khi convert).
    goods_receipt_id BIGINT NULL,
    FOREIGN KEY (supplier_id) REFERENCES supplier(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (created_by) REFERENCES user(id),
    FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipt(id)
);

-- Chiet khau + VAT chot tai thoi diem tao/sua (giong cach Hoa don chot thue) - khi convert sang
-- Goods Receipt se "nen" gia sau chiet khau vao unit_price cua dong Phieu nhap (GoodsReceiptDetail
-- khong co cot chiet khau/thue rieng).
CREATE TABLE purchase_request_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_request_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    line_subtotal DECIMAL(18,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(18,2) NOT NULL,
    note VARCHAR(255),
    FOREIGN KEY (purchase_request_id) REFERENCES purchase_request(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id)
);

INSERT INTO numbering_config (doc_type, prefix, current_sequence) VALUES
    ('PURCHASE_REQUEST', 'YCM', 0);
