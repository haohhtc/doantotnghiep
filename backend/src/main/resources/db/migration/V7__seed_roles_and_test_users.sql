-- V7: Bo sung 2 role con thieu (moi co ADMIN tu V1) + user mau cho tung role de test dang nhap.
-- Khop dung Role.code da khai bao trong comment cua backend/.../user/entity/Role.java.

INSERT INTO role (code, name, description) VALUES
    ('WAREHOUSE_MANAGER', 'Quan ly kho', 'Quan ly nhap/xuat/ton kho'),
    ('SALES_STAFF', 'Nhan vien ban hang', 'Tao va xu ly don hang ban');

-- Mat khau BCrypt cho "admin123" (dung chung voi user admin de de nho khi test).
INSERT INTO user (username, password, full_name, email, role_id, status) VALUES
    ('kho01', '$2a$10$zuJMJpzJK5JmtGKGAlsdP.R2F2cfk3c2EpNf6WDRvpcTw2lXxLs52', 'Nhan vien Kho', 'kho01@example.com',
        (SELECT id FROM role WHERE code = 'WAREHOUSE_MANAGER'), 'ACTIVE'),
    ('sale01', '$2a$10$zuJMJpzJK5JmtGKGAlsdP.R2F2cfk3c2EpNf6WDRvpcTw2lXxLs52', 'Nhan vien Sale', 'sale01@example.com',
        (SELECT id FROM role WHERE code = 'SALES_STAFF'), 'ACTIVE');
