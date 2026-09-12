-- V16: Chuc vu (Employee Position) va Loai nhan vien ban hang (Salesman Type).
-- Khong tach Employee thanh bang rieng - dung chung bang `user` (don gian hoa, xem tonghop.md
-- muc "Nhan vien"). Bang "user" (so it, dung theo User.java @Table(name = "user")).

CREATE TABLE employee_position (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE salesman_type (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

ALTER TABLE user
    ADD COLUMN position_id BIGINT NULL,
    ADD COLUMN salesman_type_id BIGINT NULL,
    ADD COLUMN branch_id BIGINT NULL,
    ADD FOREIGN KEY (position_id) REFERENCES employee_position(id),
    ADD FOREIGN KEY (salesman_type_id) REFERENCES salesman_type(id),
    ADD FOREIGN KEY (branch_id) REFERENCES branch(id);

-- Seed du lieu mau chuan FMCG.
INSERT INTO employee_position (code, name, description) VALUES
('SALESMAN', 'Salesman', 'Nhân viên bán hàng trực tiếp trên tuyến'),
('SS', 'Sales Supervisor', 'Giám sát bán hàng, quản lý 1 nhóm Salesman'),
('ASM', 'Area Sales Manager', 'Quản lý bán hàng theo khu vực');

INSERT INTO salesman_type (code, name, description) VALUES
('PRESELL', 'Presell', 'Đi ghi đơn hàng trước, giao hàng sau'),
('VAN_SALES', 'Van Sales', 'Vừa đi vừa bán vừa giao hàng ngay trên xe'),
('DELIVERY', 'Delivery', 'Chỉ giao hàng theo đơn đã chốt, không bán');
