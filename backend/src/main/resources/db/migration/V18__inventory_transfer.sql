-- V18: Dieu chuyen kho (Inventory Transfer) - 2 buoc xac nhan that giong DMS that (xem
-- ui-reference/04-ton-kho/dieu-chuyen-kho-inventorytransfer-tao-moi.png + sidebar that co
-- 2 muc rieng "Inventory Transfer for Branch" va "Inventory Transfer Confirmation"):
-- DRAFT -> (kho nguon xac nhan xuat) -> IN_TRANSIT -> (kho dich xac nhan nhan) -> CLOSED.

CREATE TABLE inventory_transfer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    posting_date DATE,
    from_warehouse_id BIGINT NOT NULL,
    to_warehouse_id BIGINT NOT NULL,
    sales_employee_id BIGINT,
    -- REBALANCE / REQUEST / CONSIGNMENT - giu dang free-text nhu he thong that.
    reason VARCHAR(50) NOT NULL,
    remarks VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    sent_at DATETIME,
    received_at DATETIME,
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (from_warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (to_warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (sales_employee_id) REFERENCES user(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE inventory_transfer_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inventory_transfer_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    batch VARCHAR(100),
    note VARCHAR(255),
    FOREIGN KEY (inventory_transfer_id) REFERENCES inventory_transfer(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);
