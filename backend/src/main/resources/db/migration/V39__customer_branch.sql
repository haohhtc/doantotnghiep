-- 1 Khach hang thuoc dung 1 Chi nhanh quan ly (1-N tu phia Chi nhanh). Them cot nullable truoc de
-- backfill du lieu that hien co, roi moi khoa NOT NULL + FK.
ALTER TABLE customer ADD COLUMN branch_id BIGINT NULL;

-- Tu dong gan theo tinh/thanh trung voi tinh/thanh cua Chi nhanh (neu Chi nhanh co khai bao tinh).
UPDATE customer c
SET c.branch_id = (
    SELECT b.id FROM branch b
    WHERE b.province_id IS NOT NULL AND b.province_id = c.province_id
    LIMIT 1
)
WHERE c.branch_id IS NULL AND c.province_id IS NOT NULL;

-- Khach con lai (khong co tinh hoac khong khop Chi nhanh nao) -> gan mac dinh ve CN-BD.
UPDATE customer c
SET c.branch_id = (SELECT id FROM branch WHERE code = 'CN-BD' LIMIT 1)
WHERE c.branch_id IS NULL;

ALTER TABLE customer MODIFY COLUMN branch_id BIGINT NOT NULL;
ALTER TABLE customer ADD CONSTRAINT fk_customer_branch FOREIGN KEY (branch_id) REFERENCES branch(id);
