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
    UNIQUE KEY uk_dim_warehouse_source (warehouse_id)
);

CREATE TABLE dim_customer (
    customer_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    customer_code VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
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
