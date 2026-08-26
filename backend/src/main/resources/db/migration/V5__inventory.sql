-- V5: Quan ly ton kho (INV-01..INV-05)
-- xem ui-reference/04-ton-kho/ va docs/03-database/erd-oltp.md (bat bien: stock.quantity
-- luon phai bang tong cac stock_transaction lien quan)

CREATE TABLE stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    updated_at DATETIME,
    UNIQUE KEY uk_stock_product_warehouse (product_id, warehouse_id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id)
);

CREATE TABLE stock_transaction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    -- IN: nhap hang | OUT: xuat ban | ADJUST: dieu chinh sau kiem ke
    type VARCHAR(10) NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    -- reference_type: GOODS_RECEIPT / SALES_ORDER / STOCK_TAKE - tro ve nguon goc bien dong
    reference_type VARCHAR(30) NOT NULL,
    reference_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id)
);

CREATE TABLE stock_take (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    warehouse_id BIGINT NOT NULL,
    -- DRAFT: dang kiem | APPROVED: da duyet, da ghi nhan chenh lech vao stock_transaction
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE stock_take_detail (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stock_take_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    system_quantity DECIMAL(18,3) NOT NULL,
    actual_quantity DECIMAL(18,3) NOT NULL,
    difference DECIMAL(18,3) NOT NULL,
    FOREIGN KEY (stock_take_id) REFERENCES stock_take(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);

CREATE TABLE stock_alert (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    min_quantity DECIMAL(18,3) NOT NULL,
    -- ACTIVE: dang duoi nguong, can nhap them | RESOLVED: da het canh bao
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    UNIQUE KEY uk_alert_product_warehouse (product_id, warehouse_id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id)
);
