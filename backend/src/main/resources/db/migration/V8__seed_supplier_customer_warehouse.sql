-- V8: Du lieu mau cho Nha cung cap / Khach hang / Kho + user con thieu (manager, warehouse01)
-- de demo cac module vua noi API that (Supplier/Customer/Warehouse).

INSERT INTO supplier (code, name, foreign_name, contact_person, phone, email, address, active) VALUES
    ('NCC-ORION', 'Cong ty TNHH Thuc pham Orion Viet Nam', 'Orion Food Vina Co., Ltd', 'Nguyen Van Hai', '02743845000', 'contact@orionvina.com.vn', 'KCN My Phuoc 2, Ben Cat, Binh Duong', TRUE);

INSERT INTO customer (code, name, phone, email, address, active) VALUES
    ('KH-WINMART', 'Dai ly Sieu thi WinMart', '19001000', 'winmart@example.com', '72 Tay Thanh, Tan Phu, TP.HCM', TRUE),
    ('KH-BHX', 'Bach Hoa Xanh', '18006000', 'bachhoaxanh@example.com', '224 Nguyen Xi, Binh Thanh, TP.HCM', TRUE),
    ('KH-COOPMART', 'Sieu thi Co.opmart', '19008998', 'coopmart@example.com', '168 Nguyen Dinh Chieu, Quan 3, TP.HCM', TRUE);

-- User con thieu: manager (dung role ADMIN vi schema chua co role rieng cho "quan ly"),
-- warehouse01 (role WAREHOUSE_MANAGER). Mat khau BCrypt cho "admin123" (dung chung de de test).
INSERT INTO user (username, password, full_name, email, role_id, status) VALUES
    ('manager', '$2a$10$zuJMJpzJK5JmtGKGAlsdP.R2F2cfk3c2EpNf6WDRvpcTw2lXxLs52', 'Quan ly chi nhanh', 'manager@example.com',
        (SELECT id FROM role WHERE code = 'ADMIN'), 'ACTIVE'),
    ('warehouse01', '$2a$10$zuJMJpzJK5JmtGKGAlsdP.R2F2cfk3c2EpNf6WDRvpcTw2lXxLs52', 'Nhan vien Kho Binh Duong', 'warehouse01@example.com',
        (SELECT id FROM role WHERE code = 'WAREHOUSE_MANAGER'), 'ACTIVE');

INSERT INTO warehouse (code, name, address, warehouse_type, manager_id, active) VALUES
    ('KHO-ORION-BD', 'Kho Chinh Orion Binh Duong', 'KCN My Phuoc 2, Ben Cat, Binh Duong', 'MAIN',
        (SELECT id FROM user WHERE username = 'warehouse01'), TRUE);
