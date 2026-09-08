-- V13: Hoan thien MDM "Product" - Uom/UomGroup/UomConversion (quy doi theo don vi goc),
-- TaxGroup, Item-Branch Assignment (phan bo san pham theo chi nhanh).

CREATE TABLE uom (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- Moi nhom co 1 don vi goc (base_uom, he so luon = 1) - cac don vi khac trong nhom quy doi
-- theo don vi goc nay (xem uom_conversion), khong phai quy doi cap-cap.
CREATE TABLE uom_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    base_uom_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (base_uom_id) REFERENCES uom(id)
);

-- factor = so luong don vi GOC tuong duong voi 1 don vi nay (khong phai so voi don vi lien ke).
CREATE TABLE uom_conversion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uom_group_id BIGINT NOT NULL,
    uom_id BIGINT NOT NULL,
    factor DECIMAL(18,4) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_uom_group_uom (uom_group_id, uom_id),
    FOREIGN KEY (uom_group_id) REFERENCES uom_group(id),
    FOREIGN KEY (uom_id) REFERENCES uom(id)
);

CREATE TABLE tax_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    rate_percent DECIMAL(5,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- Item-Branch Assignment: 1 san pham co the ap dung o nhieu chi nhanh.
CREATE TABLE item_branch (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_item_branch (product_id, branch_id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (branch_id) REFERENCES branch(id)
);

-- Bo sung cot FK (nullable) vao product - giu nguyen cot text "unit" cu de khong pha du lieu demo.
ALTER TABLE product
    ADD COLUMN uom_id BIGINT NULL,
    ADD COLUMN uom_group_id BIGINT NULL,
    ADD COLUMN tax_group_id BIGINT NULL,
    ADD FOREIGN KEY (uom_id) REFERENCES uom(id),
    ADD FOREIGN KEY (uom_group_id) REFERENCES uom_group(id),
    ADD FOREIGN KEY (tax_group_id) REFERENCES tax_group(id);

-- Seed du lieu minh hoa - khop vi du "1 Thung = 24 Hop" (Hop=12 Goi neu quy theo don vi goc
-- la Goi thi Thung = 24*12 = 288 Goi).
INSERT INTO uom (code, name) VALUES
('GOI', 'Gói'),
('HOP', 'Hộp'),
('THUNG', 'Thùng');

INSERT INTO uom_group (code, name, base_uom_id) VALUES
('NHOM-BANHKEO', 'Nhóm ĐVT Bánh kẹo', (SELECT id FROM uom WHERE code = 'GOI'));

INSERT INTO uom_conversion (uom_group_id, uom_id, factor) VALUES
((SELECT id FROM uom_group WHERE code = 'NHOM-BANHKEO'), (SELECT id FROM uom WHERE code = 'GOI'), 1),
((SELECT id FROM uom_group WHERE code = 'NHOM-BANHKEO'), (SELECT id FROM uom WHERE code = 'HOP'), 12),
((SELECT id FROM uom_group WHERE code = 'NHOM-BANHKEO'), (SELECT id FROM uom WHERE code = 'THUNG'), 288);

INSERT INTO tax_group (code, name, rate_percent) VALUES
('VAT10', 'Thuế GTGT 10%', 10.00),
('VAT0', 'Không chịu thuế', 0.00);
