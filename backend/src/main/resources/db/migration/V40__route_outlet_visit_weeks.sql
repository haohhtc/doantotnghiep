-- Doi lich ghe tham tu "tuan 1-4 trong thang" (lap lai moi thang) sang "tuan cu the trong nam"
-- (1-53, tu reset moi nam moi). Chua co khach hang nao duoc gan lich (kiem tra truoc khi code),
-- nen xoa thang 4 cot cu, khong can giu lai du lieu.
ALTER TABLE route_master_outlet
    DROP COLUMN week1,
    DROP COLUMN week2,
    DROP COLUMN week3,
    DROP COLUMN week4,
    ADD COLUMN visit_weeks VARCHAR(255) NULL;
