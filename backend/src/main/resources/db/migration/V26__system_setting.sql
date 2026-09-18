-- V26: Settings - cau hinh chung, du lieu tham khao/luu tru (giong pattern TaxGroup/CustomerGroup
-- - chua chac co noi nao doc/ap dung gia tri cu the) - xem tonghop.md.

CREATE TABLE system_setting (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(500),
    description VARCHAR(255),
    updated_at DATETIME
);
