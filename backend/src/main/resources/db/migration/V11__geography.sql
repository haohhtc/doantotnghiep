-- V11: Vung dia ly (Region/Province/District/Ward) - du lieu minh hoa khu vuc Mien Nam theo
-- cau truc don vi hanh chinh MOI (sau sap nhap 2025). Chi la du lieu demo cho do an, khong phai
-- so lieu hanh chinh chinh thuc day du ca nuoc.

CREATE TABLE region (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE province (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    region_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (region_id) REFERENCES region(id)
);

CREATE TABLE district (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    province_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (province_id) REFERENCES province(id)
);

CREATE TABLE ward (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    district_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (district_id) REFERENCES district(id)
);

-- Seed du lieu minh hoa (theo yeu cau cua nguoi dung - Mien Nam -> TP.HCM/Binh Duong/Dong Nai)
INSERT INTO region (id, code, name) VALUES
(1, 'MIEN_NAM', 'Miền Nam')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO province (id, code, name, region_id) VALUES
(1, 'TP_HCM', 'Thành phố Hồ Chí Minh', 1),
(2, 'TINH_BD', 'Tỉnh Bình Dương', 1),
(3, 'TINH_DN', 'Tỉnh Đồng Nai', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO district (id, code, name, province_id) VALUES
(1, 'Q1', 'Quận 1', 1),
(2, 'Q7', 'Quận 7', 1),
(3, 'TP_THU_DUC', 'Thành phố Thủ Đức', 1),
(4, 'TP_THU_DAU_MOT', 'Thành phố Thủ Dầu Một', 2),
(5, 'TP_BIEN_HOA', 'Thành phố Biên Hòa', 3)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO ward (id, code, name, district_id) VALUES
(1, 'P_BEN_NGHE', 'Phường Bến Nghé', 1),
(2, 'P_BEN_THANH', 'Phường Bến Thành', 1),
(3, 'P_TAN_PHONG', 'Phường Tân Phong', 2),
(4, 'P_TAN_QUY', 'Phường Tân Quy', 2),
(5, 'P_AN_PHU', 'Phường An Phú', 3),
(6, 'P_THAO_DIEN', 'Phường Thảo Điền', 3),
(7, 'P_PHU_HOA', 'Phường Phú Hòa', 4),
(8, 'P_TRANGBOM', 'Phường Trảng Dài', 5)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Bo sung cot FK dia ly (nullable) vao selling_zone/branch/customer - giu nguyen cot text cu
-- (selling_zone.region/province/ward) de khong pha du lieu demo hien co.
ALTER TABLE selling_zone
    ADD COLUMN region_id BIGINT NULL,
    ADD COLUMN province_id BIGINT NULL,
    ADD COLUMN district_id BIGINT NULL,
    ADD COLUMN ward_id BIGINT NULL,
    ADD FOREIGN KEY (region_id) REFERENCES region(id),
    ADD FOREIGN KEY (province_id) REFERENCES province(id),
    ADD FOREIGN KEY (district_id) REFERENCES district(id),
    ADD FOREIGN KEY (ward_id) REFERENCES ward(id);

ALTER TABLE branch
    ADD COLUMN region_id BIGINT NULL,
    ADD COLUMN province_id BIGINT NULL,
    ADD COLUMN district_id BIGINT NULL,
    ADD COLUMN ward_id BIGINT NULL,
    ADD FOREIGN KEY (region_id) REFERENCES region(id),
    ADD FOREIGN KEY (province_id) REFERENCES province(id),
    ADD FOREIGN KEY (district_id) REFERENCES district(id),
    ADD FOREIGN KEY (ward_id) REFERENCES ward(id);

ALTER TABLE customer
    ADD COLUMN region_id BIGINT NULL,
    ADD COLUMN province_id BIGINT NULL,
    ADD COLUMN district_id BIGINT NULL,
    ADD COLUMN ward_id BIGINT NULL,
    ADD FOREIGN KEY (region_id) REFERENCES region(id),
    ADD FOREIGN KEY (province_id) REFERENCES province(id),
    ADD FOREIGN KEY (district_id) REFERENCES district(id),
    ADD FOREIGN KEY (ward_id) REFERENCES ward(id);
