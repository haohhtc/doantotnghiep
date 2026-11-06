-- Dimension tables cho Data Warehouse (erp_qlkho_dw)
-- Surrogate key rieng (KHONG dung id goc tu OLTP) - ETL map qua khi transform.
-- Thiet ke: docs/03-database/erd-dw.md

CREATE TABLE dim_product (
    product_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,          -- id goc ben OLTP, dung de ETL doi chieu
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category_name VARCHAR(150),
    unit VARCHAR(30),
    -- Them khop voi du lieu seed thuc te cua tv2 (03_seed_data.sql) - xem dalam.md 2026-11-03.
    unit_code VARCHAR(20),
    tax_rate DECIMAL(5,2),
    extra1 VARCHAR(255),                 -- chua ro muc dich, luon NULL trong du lieu hien tai - hoi lai tv2
    extra2 VARCHAR(255),
    UNIQUE KEY uk_dim_product_source (product_id)
);

CREATE TABLE dim_supplier (
    supplier_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    supplier_code VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    UNIQUE KEY uk_dim_supplier_source (supplier_id)
);

CREATE TABLE dim_warehouse (
    warehouse_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id BIGINT NOT NULL,
    warehouse_code VARCHAR(50) NOT NULL,
    warehouse_name VARCHAR(150) NOT NULL,
    warehouse_type VARCHAR(20),
    -- Them khop voi du lieu seed thuc te cua tv2 (03_seed_data.sql) - xem dalam.md 2026-11-03.
    branch_code VARCHAR(50),
    branch_name VARCHAR(150),
    UNIQUE KEY uk_dim_warehouse_source (warehouse_id)
);

CREATE TABLE dim_customer (
    customer_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    customer_code VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    -- Them khop voi du lieu seed thuc te cua tv2 (03_seed_data.sql) - xem dalam.md 2026-11-03.
    channel_code VARCHAR(20),
    channel_name VARCHAR(100),
    region VARCHAR(100),
    province VARCHAR(100),
    ward VARCHAR(150),
    extra1 VARCHAR(255),                 -- 6 cot chua ro muc dich, luon NULL trong du lieu hien tai - hoi lai tv2
    extra2 VARCHAR(255),
    extra3 VARCHAR(255),
    extra4 VARCHAR(255),
    extra5 VARCHAR(255),
    extra6 VARCHAR(255),
    UNIQUE KEY uk_dim_customer_source (customer_id)
);

CREATE TABLE dim_time (
    time_key INT PRIMARY KEY,            -- format yyyyMMdd
    full_date DATE NOT NULL,
    day TINYINT NOT NULL,
    month TINYINT NOT NULL,
    quarter TINYINT NOT NULL,
    year SMALLINT NOT NULL,
    day_of_week TINYINT NOT NULL,        -- 1=Mon .. 7=Sun
    is_weekend BOOLEAN NOT NULL
);
