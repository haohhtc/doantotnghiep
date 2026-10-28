-- V54: Them cot "Nguon" (source) cho Don hang ban/Don giao hang/Hoa don - phan biet chung tu
-- tao tu Web (MANUAL, nhan vien van phong/kho thao tac) hay tu App Van-Sales (APP, NVBH tao
-- tren dien thoai khi ghe tham khach). Phuc vu phan tich AI/BI theo kenh tao don.
-- Nullable + DEFAULT 'MANUAL' de khong pha du lieu cu da co.

ALTER TABLE sales_order
    ADD COLUMN source VARCHAR(10) NOT NULL DEFAULT 'MANUAL' COMMENT 'MANUAL (web) hoac APP (Van-Sales)';

ALTER TABLE delivery_order
    ADD COLUMN source VARCHAR(10) NOT NULL DEFAULT 'MANUAL' COMMENT 'MANUAL (web) hoac APP (Van-Sales)';

ALTER TABLE invoice
    ADD COLUMN source VARCHAR(10) NOT NULL DEFAULT 'MANUAL' COMMENT 'MANUAL (web) hoac APP (Van-Sales)';
