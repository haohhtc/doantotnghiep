-- V15: Nhom khach hang (Customer Group) va Kenh ban hang (Account/Channel Definition).
-- 2 bang nay chi la du lieu mo ta/phan loai hien thi tren form Khach hang, khong co logic
-- tinh toan nao khac (khong tu lien ket voi price_list.type) - xem tonghop.md muc "Khach hang".

CREATE TABLE customer_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE customer_channel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

ALTER TABLE customer
    ADD COLUMN group_id BIGINT NULL,
    ADD COLUMN channel_id BIGINT NULL,
    ADD FOREIGN KEY (group_id) REFERENCES customer_group(id),
    ADD FOREIGN KEY (channel_id) REFERENCES customer_channel(id);

-- Seed du lieu mau chuan FMCG.
INSERT INTO customer_group (code, name, description) VALUES
('DAILY-C1', 'Đại lý cấp 1', 'Đại lý phân phối trực tiếp từ công ty'),
('DAILY-C2', 'Đại lý cấp 2', 'Đại lý mua lại từ đại lý cấp 1'),
('KHACH-LE', 'Khách lẻ', 'Cửa hàng bán lẻ nhỏ, mua trực tiếp');

INSERT INTO customer_channel (code, name, description) VALUES
('GT', 'Kênh đại lý truyền thống', 'General Trade - tạp hóa, đại lý truyền thống'),
('MT', 'Kênh siêu thị hiện đại', 'Modern Trade - siêu thị, cửa hàng tiện lợi'),
('HORECA', 'Kênh nhà hàng khách sạn', 'Hotel/Restaurant/Cafe');
