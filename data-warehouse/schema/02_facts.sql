-- Fact tables cho Data Warehouse (erp_qlkho_dw)
-- Chay SAU 01_dimensions.sql (co FK tro toi cac bang dim_*).
-- Thiet ke: docs/03-database/erd-dw.md

-- Grain: 1 dong = 1 dong chi tiet phieu nhap (goods_receipt_detail)
CREATE TABLE fact_inbound (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_key BIGINT NOT NULL,
    supplier_key BIGINT NOT NULL,
    warehouse_key BIGINT NOT NULL,
    time_key INT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (product_key) REFERENCES dim_product(product_key),
    FOREIGN KEY (supplier_key) REFERENCES dim_supplier(supplier_key),
    FOREIGN KEY (warehouse_key) REFERENCES dim_warehouse(warehouse_key),
    FOREIGN KEY (time_key) REFERENCES dim_time(time_key)
);

-- fact_sales (star schema gon, 1 dong = 1 dong chi tiet don hang CONFIRMED) DA THAY BANG
-- fact_sellout (xem 04_fact_sellout.sql) - 1 bang rong denormalized khop template Power BI
-- "FACT_SellOut", de Power BI chi can Import 1 bang, khong can dung Data Model/quan he.

-- Grain: 1 dong = 1 ban ghi stock_transaction (IN/OUT/ADJUST)
CREATE TABLE fact_stock_movement (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_key BIGINT NOT NULL,
    warehouse_key BIGINT NOT NULL,
    time_key INT NOT NULL,
    movement_type VARCHAR(10) NOT NULL,   -- IN / OUT / ADJUST
    quantity DECIMAL(18,3) NOT NULL,
    FOREIGN KEY (product_key) REFERENCES dim_product(product_key),
    FOREIGN KEY (warehouse_key) REFERENCES dim_warehouse(warehouse_key),
    FOREIGN KEY (time_key) REFERENCES dim_time(time_key)
);

-- Grain: 1 dong = ton kho cuoi ngay theo product x warehouse (append moi ngay, KHONG ghi de)
CREATE TABLE fact_inventory_snapshot (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_key BIGINT NOT NULL,
    warehouse_key BIGINT NOT NULL,
    time_key INT NOT NULL,
    quantity_on_hand DECIMAL(18,3) NOT NULL,
    FOREIGN KEY (product_key) REFERENCES dim_product(product_key),
    FOREIGN KEY (warehouse_key) REFERENCES dim_warehouse(warehouse_key),
    FOREIGN KEY (time_key) REFERENCES dim_time(time_key),
    UNIQUE KEY uk_snapshot_product_warehouse_time (product_key, warehouse_key, time_key)
);
