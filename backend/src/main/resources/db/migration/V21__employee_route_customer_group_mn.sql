-- V21: Employee tach bang rieng khoi User + Customer Group chuyen sang M:N + Route tach 2 bang
-- doc lap (route_salesman_assignment/route_manager_assignment) THAY THE han module RouteSetting cu
-- (theo quyet dinh cua nguoi dung) + RouteMasterOutlet bo sung lich ghe tham + Branch them
-- default_manager/default_salesman - xem tonghop.md muc "Nhi dat hang lon" Nhom 5.

-- 1) Employee: 1 bang chung cho ca 2 tab NVBH/NV, loc theo "type".
CREATE TABLE employee (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(10) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    gender VARCHAR(10),
    birth_date DATE,
    address VARCHAR(500),
    id_card_number VARCHAR(50),
    tax_code VARCHAR(50),
    position_id BIGINT,
    hire_date DATE,
    resign_date DATE,
    is_delivery_man BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    user_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (position_id) REFERENCES employee_position(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Backfill: 1 Employee/User co san (du lieu demo nho, an toan tao het thay vi chi tao cho user
-- dang duoc route tham chieu) - type suy tu role (SALES_STAFF -> NVBH, con lai -> NV).
INSERT INTO employee (type, code, full_name, phone, email, position_id, is_delivery_man, active, user_id, created_at)
SELECT
    CASE WHEN r.code = 'SALES_STAFF' THEN 'NVBH' ELSE 'NV' END,
    CONCAT('EMP-', u.username),
    COALESCE(u.full_name, u.username),
    NULL, u.email, u.position_id, FALSE,
    (u.status = 'ACTIVE'),
    u.id, NOW()
FROM user u JOIN role r ON r.id = u.role_id;

-- 2) Customer Group: FK don -> M:N.
CREATE TABLE customer_group_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_group_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_customer_group_member (customer_group_id, customer_id),
    FOREIGN KEY (customer_group_id) REFERENCES customer_group(id),
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);

INSERT INTO customer_group_member (customer_group_id, customer_id)
SELECT group_id, id FROM customer WHERE group_id IS NOT NULL;

SET @fk_cust_group := (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer' AND COLUMN_NAME = 'group_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1);
SET @sql := CONCAT('ALTER TABLE customer DROP FOREIGN KEY ', @fk_cust_group);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE customer DROP COLUMN group_id;

-- 3) Route: thay the han RouteSetting bang 2 bang doc lap (giu 2 timeline rieng cho NVBH/Quan ly).
CREATE TABLE route_salesman_assignment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_master_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (route_master_id) REFERENCES route_master(id),
    FOREIGN KEY (employee_id) REFERENCES employee(id)
);

CREATE TABLE route_manager_assignment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_master_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (route_master_id) REFERENCES route_master(id),
    FOREIGN KEY (employee_id) REFERENCES employee(id)
);

-- Migrate du lieu tu route_setting cu sang 2 bang moi (khop qua employee.user_id).
INSERT INTO route_salesman_assignment (route_master_id, employee_id, effective_date, end_date)
SELECT rs.route_master_id, e.id, rs.effective_date, rs.end_date
FROM route_setting rs JOIN employee e ON e.user_id = rs.sales_person_id;

INSERT INTO route_manager_assignment (route_master_id, employee_id, effective_date, end_date)
SELECT rs.route_master_id, e.id, rs.effective_date, rs.end_date
FROM route_setting rs JOIN employee e ON e.user_id = rs.manage_by_id
WHERE rs.manage_by_id IS NOT NULL;

DROP TABLE route_setting;

-- 4) RouteMasterOutlet: bo sung thu tu ghe tham + lich ghe tham (thu/tuan trong thang).
ALTER TABLE route_master_outlet
    ADD COLUMN visit_order INT NULL,
    ADD COLUMN monday BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN tuesday BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN wednesday BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN thursday BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN friday BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN saturday BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN sunday BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN week1 BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN week2 BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN week3 BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN week4 BOOLEAN NOT NULL DEFAULT FALSE;

-- 5) Branch: gia tri goi y mac dinh khi tao Route moi (khong bat buoc).
ALTER TABLE branch
    ADD COLUMN default_manager_id BIGINT NULL,
    ADD COLUMN default_salesman_id BIGINT NULL,
    ADD FOREIGN KEY (default_manager_id) REFERENCES employee(id),
    ADD FOREIGN KEY (default_salesman_id) REFERENCES employee(id);
