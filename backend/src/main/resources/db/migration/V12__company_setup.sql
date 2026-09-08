-- V12: "Company Setup" - cap to chuc cao nhat (Company) + noi Kho vao Chi nhanh.
-- Phan cap dung theo file DMS tham chieu: Company -> Branch -> Warehouse.

CREATE TABLE company (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    tax_code VARCHAR(50),
    address VARCHAR(500),
    phone VARCHAR(30),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- Seed 1 ban ghi Cong ty mac dinh (dai dien cong ty phan phoi dang van hanh he thong nay -
-- khac voi NCC-ORION la nha cung cap, khong phai chinh minh).
INSERT INTO company (code, name, tax_code, address, phone) VALUES
('CTY-CHINH', 'Công ty TNHH Phân phối Bình Dương', NULL, NULL, NULL);

-- Branch thuoc ve 1 Company - nullable o DB de an toan migrate, nhung backfill ngay ban ghi
-- hien co ve Company vua seed, va DTO se bat buoc chon khi tao Chi nhanh moi.
ALTER TABLE branch ADD COLUMN company_id BIGINT NULL;
UPDATE branch SET company_id = (SELECT id FROM company WHERE code = 'CTY-CHINH');
ALTER TABLE branch ADD CONSTRAINT fk_branch_company FOREIGN KEY (company_id) REFERENCES company(id);

-- Warehouse thuoc ve 1 Branch - nullable, khong bat buoc (kho co the chua gan chi nhanh).
ALTER TABLE warehouse ADD COLUMN branch_id BIGINT NULL;
ALTER TABLE warehouse ADD CONSTRAINT fk_warehouse_branch FOREIGN KEY (branch_id) REFERENCES branch(id);
