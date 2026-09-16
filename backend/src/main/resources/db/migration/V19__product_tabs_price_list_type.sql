-- V19: Product tach 3 tab Purchase/Sale/Inventory (moi tab 1 UOM + 1 Nhom thue rieng, dung chung
-- 1 uom_group) + Price List hard-code type Mua/Ban - xem tonghop.md muc "Nhi dat hang lon" Nhom 3+4.

ALTER TABLE product
    ADD COLUMN purchase_uom_id BIGINT NULL,
    ADD COLUMN purchase_tax_group_id BIGINT NULL,
    ADD COLUMN sale_uom_id BIGINT NULL,
    ADD COLUMN sale_tax_group_id BIGINT NULL,
    ADD COLUMN inventory_uom_id BIGINT NULL,
    ADD COLUMN inventory_tax_group_id BIGINT NULL,
    ADD FOREIGN KEY (purchase_uom_id) REFERENCES uom(id),
    ADD FOREIGN KEY (purchase_tax_group_id) REFERENCES tax_group(id),
    ADD FOREIGN KEY (sale_uom_id) REFERENCES uom(id),
    ADD FOREIGN KEY (sale_tax_group_id) REFERENCES tax_group(id),
    ADD FOREIGN KEY (inventory_uom_id) REFERENCES uom(id),
    ADD FOREIGN KEY (inventory_tax_group_id) REFERENCES tax_group(id);

-- Backfill tu 2 cot don cu (uom_id/tax_group_id) sang ca 3 tab - giu nguyen y nghia du lieu cu.
UPDATE product SET
    purchase_uom_id = uom_id, purchase_tax_group_id = tax_group_id,
    sale_uom_id = uom_id, sale_tax_group_id = tax_group_id,
    inventory_uom_id = uom_id, inventory_tax_group_id = tax_group_id;

-- Seed 2 Bang gia mac dinh (PURCHASE/SALE) roi copy product.price cu vao price_list_item theo
-- sale_uom/purchase_uom - de sau khi xoa cot price/fallback, du lieu demo/test khong bi trong gia.
INSERT INTO price_list (code, name, type, is_active) VALUES
    ('PL-SALE-DEFAULT', 'Bảng giá bán mặc định', 'SALE', TRUE),
    ('PL-PURCHASE-DEFAULT', 'Bảng giá mua mặc định', 'PURCHASE', TRUE);

INSERT INTO price_list_item (price_list_id, product_id, uom_id, price)
SELECT (SELECT id FROM price_list WHERE code = 'PL-SALE-DEFAULT'), p.id, p.sale_uom_id, p.price
FROM product p WHERE p.sale_uom_id IS NOT NULL;

INSERT INTO price_list_item (price_list_id, product_id, uom_id, price)
SELECT (SELECT id FROM price_list WHERE code = 'PL-PURCHASE-DEFAULT'), p.id, p.purchase_uom_id, p.price
FROM product p WHERE p.purchase_uom_id IS NOT NULL;

-- Xoa cac cot cu: price (chuyen het sang price_list_item o tren), unit (text tu do cu), va cap
-- uom_id/tax_group_id don (da duoc thay bang 3 cap purchase/sale/inventory o tren). Ten FK constraint
-- la do MySQL tu sinh (vd product_ibfk_2) tu luc V13 tao cot, khong doan ten thu cong - tra dong
-- tu information_schema roi drop bang prepared statement de an toan.
SET @fk_uom := (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'uom_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1);
SET @sql := CONCAT('ALTER TABLE product DROP FOREIGN KEY ', @fk_uom);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_tax := (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'tax_group_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1);
SET @sql := CONCAT('ALTER TABLE product DROP FOREIGN KEY ', @fk_tax);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE product
    DROP COLUMN price,
    DROP COLUMN unit,
    DROP COLUMN uom_id,
    DROP COLUMN tax_group_id;
