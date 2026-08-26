-- ========================================================================
-- FULL SCHEMA OLTP (erp_qlkho_oltp) - file gop tham khao, xem toan bo quan he
-- Nguon that (chay bang Flyway khi start backend): backend/src/main/resources/db/migration/V1..V5
-- File nay CHI de xem tong the / import vao MySQL Workbench, dbdiagram.io de ve ERD.
-- KHONG sua truc tiep file nay - sua o V1..V5 roi chay lai script gop neu can cap nhat.
-- ========================================================================

-- ======================== V1__init_schema.sql ========================
-- V1: schema cho module Auth/User (vi du mau da code day du trong package auth/ va user/)
-- Cac bang con lai (product, product_category, supplier, warehouse, goods_receipt,
-- sales_order, stock, stock_transaction, stock_take, stock_alert...) se duoc them
-- trong cac migration V2, V3... khi code phan tuong ung.
-- Thiet ke day du xem: docs/03-database/erd-oltp.md

CREATE TABLE role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE role_permission (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES role(id),
    FOREIGN KEY (permission_id) REFERENCES permission(id)
);

CREATE TABLE user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    email VARCHAR(150),
    role_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (role_id) REFERENCES role(id)
);

-- Seed role mac dinh de dang nhap thu (mat khau BCrypt cho "admin123" - tu doi lai khi trien khai)
INSERT INTO role (code, name, description) VALUES ('ADMIN', 'Quan tri he thong', 'Toan quyen');

-- ======================== V2__master_data.sql ========================
-- V2: Danh muc (CAT-01..CAT-04)
-- Field dat ten tham khao theo UI that (Code/Name/Active, Whse Type...) - xem ui-reference/01-danh-muc/

CREATE TABLE product_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    parent_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (parent_id) REFERENCES product_category(id)
);

CREATE TABLE product (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    foreign_name VARCHAR(255),
    category_id BIGINT NOT NULL,
    unit VARCHAR(30),
    price DECIMAL(18,2) NOT NULL DEFAULT 0,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES product_category(id)
);

CREATE TABLE supplier (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    foreign_name VARCHAR(255),
    contact_person VARCHAR(150),
    phone VARCHAR(30),
    email VARCHAR(150),
    address VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE warehouse (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(500),
    -- Loai kho tham khao UI that: MAIN / VAN / DAMAGE / CONSIGNMENT
    warehouse_type VARCHAR(20) NOT NULL DEFAULT 'MAIN',
    manager_id BIGINT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (manager_id) REFERENCES user(id)
);

-- ======================== V3__inbound.sql ========================
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

-- ======================== V4__sales.sql ========================
-- V4: Quan ly ban hang (SALE-01..SALE-05)
-- Field dat ten tham khao theo UI that: Doc Number/Doc Date/Customer Code/Customer Name/Address
-- xem ui-reference/03-ban-hang/

CREATE TABLE customer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    address VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE sales_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    customer_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    -- PENDING: cho xac nhan | CONFIRMED: da xuat kho | CANCELLED: da huy
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE sales_order_detail (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sales_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (sales_order_id) REFERENCES sales_order(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);

-- ======================== V5__inventory.sql ========================
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

