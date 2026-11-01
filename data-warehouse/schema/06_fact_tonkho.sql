-- Wide-denormalized tables for Power BI BC_TONKHO (no surrogate key joins needed)
-- Grain fact_tonkho: 1 row = 1 product × 1 warehouse, snapshot ngay hom nay
CREATE TABLE IF NOT EXISTS fact_tonkho (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    snapshot_date        DATE NOT NULL,
    snapshot_year        SMALLINT,
    snapshot_month       TINYINT,
    product_code         VARCHAR(50),
    product_name         VARCHAR(255),
    category_code        VARCHAR(50),
    category_name        VARCHAR(150),
    parent_category_code VARCHAR(50),
    parent_category_name VARCHAR(150),
    warehouse_code       VARCHAR(50),
    warehouse_name       VARCHAR(150),
    warehouse_type       VARCHAR(20),
    branch_code          VARCHAR(50),
    branch_name          VARCHAR(150),
    quantity_on_hand     DECIMAL(18,3),
    avg_unit_price       DECIMAL(18,2),
    inventory_value      DECIMAL(18,2),
    stock_status         VARCHAR(20),
    slicer_product       VARCHAR(400),
    slicer_warehouse     VARCHAR(400),
    etl_batch_date       DATE
);

-- Grain fact_tonkho_movement: 1 row = 1 stock_transaction
CREATE TABLE IF NOT EXISTS fact_tonkho_movement (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    txn_id               BIGINT,
    txn_date             DATE,
    txn_year             SMALLINT,
    txn_month            TINYINT,
    product_code         VARCHAR(50),
    product_name         VARCHAR(255),
    category_code        VARCHAR(50),
    category_name        VARCHAR(150),
    warehouse_code       VARCHAR(50),
    warehouse_name       VARCHAR(150),
    warehouse_type       VARCHAR(20),
    branch_code          VARCHAR(50),
    branch_name          VARCHAR(150),
    txn_type             VARCHAR(10),
    txn_type_vn          VARCHAR(30),
    reference_type       VARCHAR(30),
    reference_type_vn    VARCHAR(60),
    quantity             DECIMAL(18,3),
    slicer_product       VARCHAR(400),
    slicer_warehouse     VARCHAR(400),
    etl_batch_date       DATE
);
