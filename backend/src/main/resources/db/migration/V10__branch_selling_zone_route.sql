-- V10: Tuyen ban hang & Chi nhanh (module moi theo yeu cau TV2 - xem tuyen-ban-hang-overview.html)
-- 5 bang: branch, selling_zone, route_master, route_master_outlet, route_setting.
-- Luu y: file thiet ke goc ghi nham la "V6" - da doi thanh V10 vi V6 da dung cho seed Orion.

CREATE TABLE branch (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(500),
    phone VARCHAR(30),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE selling_zone (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    region VARCHAR(100),
    province VARCHAR(100),
    ward VARCHAR(100),
    branch_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (branch_id) REFERENCES branch(id)
);

-- type/channel/selling_category: giu dang free-text nhu he thong that (khong tach bang rieng).
CREATE TABLE route_master (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50),
    channel VARCHAR(50),
    selling_category VARCHAR(50),
    selling_zone_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    manage_by_id BIGINT,
    salesman_id BIGINT,
    effective_date DATE NOT NULL,
    end_date DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (selling_zone_id) REFERENCES selling_zone(id),
    FOREIGN KEY (branch_id) REFERENCES branch(id),
    FOREIGN KEY (manage_by_id) REFERENCES user(id),
    FOREIGN KEY (salesman_id) REFERENCES user(id)
);

-- Bang join "List Of Outlet" - dung id tu tang + UNIQUE cap thay vi PK kep de khop quy uoc
-- chung cua toan schema (moi bang deu co id BIGINT AUTO_INCREMENT).
CREATE TABLE route_master_outlet (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_master_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_route_master_outlet (route_master_id, customer_id),
    FOREIGN KEY (route_master_id) REFERENCES route_master(id),
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);

CREATE TABLE route_setting (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    route_master_id BIGINT NOT NULL,
    sales_person_id BIGINT NOT NULL,
    manage_by_id BIGINT,
    effective_date DATE NOT NULL,
    end_date DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (route_master_id) REFERENCES route_master(id),
    FOREIGN KEY (sales_person_id) REFERENCES user(id),
    FOREIGN KEY (manage_by_id) REFERENCES user(id)
);
