-- fact_sellout: bang ban hang dang WIDE/DENORMALIZED, thay the fact_sales (star schema) lam
-- nguon du lieu ban hang chinh cho Power BI - khop ten cot theo 1 template Power BI "FACT_SellOut"
-- co san, de Power BI chi can Import 1 bang duy nhat, khong can dung Data Model/quan he thu cong.
-- Grain: 1 dong = 1 dong chi tiet don ban da CONFIRMED (sales_order_detail).
-- fact_inbound/fact_stock_movement/fact_inventory_snapshot (01_dimensions.sql, 02_facts.sql)
-- VAN GIU NGUYEN theo star schema - fact_sellout chi thay rieng phan ban hang.

-- Mo rong dim_product (chi them cot chua co)
ALTER TABLE dim_product
    ADD COLUMN parent_category_name VARCHAR(150),
    ADD COLUMN product_group_name   VARCHAR(150);

-- Mo rong dim_customer (chi them cot chua co)
ALTER TABLE dim_customer
    ADD COLUMN district_name VARCHAR(150),
    ADD COLUMN address       VARCHAR(500),
    ADD COLUMN group_code    VARCHAR(50),
    ADD COLUMN group_name    VARCHAR(150),
    ADD COLUMN branch_code   VARCHAR(50),
    ADD COLUMN branch_name   VARCHAR(150);

CREATE TABLE IF NOT EXISTS fact_sellout (
    id                          BIGINT AUTO_INCREMENT PRIMARY KEY,

    product_key                 BIGINT,
    customer_key                BIGINT,
    warehouse_key               BIGINT,
    time_key                    INT,

    -- Sales Order header
    so_id                       BIGINT NOT NULL,
    so_detail_id                BIGINT NOT NULL,
    so_order_number             VARCHAR(50),
    so_order_date               DATE,
    so_order_year               SMALLINT,
    so_order_month              TINYINT,
    so_order_status             VARCHAR(20),
    so_order_status_vn          VARCHAR(50),
    sos_order_status_icon_vn    VARCHAR(10),
    sos_order_type_vn           VARCHAR(50),
    source_type                 VARCHAR(50),

    -- Product (denormalized)
    product_code                VARCHAR(50),
    product_name                VARCHAR(255),
    product_uom_code            VARCHAR(50),
    category_code               VARCHAR(50),
    category_name               VARCHAR(150),
    parent_category_code        VARCHAR(50),
    parent_category_name        VARCHAR(150),
    product_group_code          VARCHAR(50),
    product_group_name          VARCHAR(150),

    -- Customer (denormalized)
    customer_code               VARCHAR(50),
    customer_name               VARCHAR(255),
    customer_address             VARCHAR(500),
    customer_province           VARCHAR(150),
    customer_district            VARCHAR(150),
    customer_ward                VARCHAR(150),
    customer_channel_code       VARCHAR(50),
    customer_channel_name       VARCHAR(150),
    customer_group_code         VARCHAR(50),
    customer_group_name         VARCHAR(150),

    -- Branch / Distributor
    branch_code                 VARCHAR(50),
    branch_name                 VARCHAR(150),

    -- Sales Territory
    region_name                 VARCHAR(150),
    selling_zone_name           VARCHAR(150),
    branch_territory_name       VARCHAR(150),
    route_code                  VARCHAR(50),
    route_name                  VARCHAR(150),
    selling_category_code       VARCHAR(50),

    -- Salesman
    salesperson_code            VARCHAR(50),
    salesperson_name            VARCHAR(150),
    supervisor_code             VARCHAR(50),
    supervisor_name             VARCHAR(150),

    -- Warehouse
    warehouse_code               VARCHAR(50),

    -- Quantity & Amount
    quantity                    DECIMAL(18,3),
    unit_price                  DECIMAL(18,2),
    line_amount                 DECIMAL(18,2),
    tax_rate                    DECIMAL(5,2),
    tax_amount                  DECIMAL(18,2),
    line_amount_after_tax       DECIMAL(18,2),
    discount_amount             DECIMAL(18,2) DEFAULT 0,
    line_amount_before_discount DECIMAL(18,2),

    -- Invoice info (khi ton tai)
    invoice_number               VARCHAR(50),
    invoice_date                 DATE,
    invoice_line_total           DECIMAL(18,2),

    -- Delivery Order info (khi ton tai)
    delivery_number               VARCHAR(50),
    delivery_date                 DATE,
    delivery_quantity             DECIMAL(18,3),

    -- Slicer helpers (noi san cho filter Power BI)
    slicer_customer              VARCHAR(400),
    slicer_distributor           VARCHAR(300),
    slicer_salesman              VARCHAR(300),
    slicer_supervisor            VARCHAR(300),
    slicer_product                VARCHAR(400),

    -- ETL metadata
    etl_loaded_at                 DATETIME DEFAULT CURRENT_TIMESTAMP,
    etl_batch_date                DATE,

    FOREIGN KEY (product_key)   REFERENCES dim_product(product_key),
    FOREIGN KEY (customer_key)  REFERENCES dim_customer(customer_key),
    FOREIGN KEY (warehouse_key) REFERENCES dim_warehouse(warehouse_key),
    FOREIGN KEY (time_key)      REFERENCES dim_time(time_key),

    UNIQUE KEY uk_fact_sellout_detail (so_detail_id)
);

-- Ngay refresh gan nhat (Power BI hien thi "Last date updated")
CREATE TABLE IF NOT EXISTS last_date_refresh (
    id                INT PRIMARY KEY DEFAULT 1,
    last_date_updated DATETIME NOT NULL
);
