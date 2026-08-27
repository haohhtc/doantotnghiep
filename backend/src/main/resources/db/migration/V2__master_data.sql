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
