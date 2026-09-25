-- Buoc 3: Don vi tinh (Goi/Hop/Thung) tren tung dong chung tu + quy doi ve don vi co so (base_quantity).
-- Ton kho luu theo DON VI CO SO cua nhom quy doi (GOI); dong cu (uom_id NULL) coi nhu he so 1.

-- 1) Nhom quy doi demo sat thuc te FMCG (moi nhom 1 quy cach dong goi), don vi co so = GOI.
INSERT INTO uom_group (code, name, base_uom_id) VALUES
    ('QC-12X12', 'Chocopie: hop 12 goi, thung 12 hop', (SELECT id FROM uom WHERE code = 'GOI')),
    ('QC-6X16',  'Custas: hop 6 goi, thung 16 hop',   (SELECT id FROM uom WHERE code = 'GOI')),
    ('QC-COSY',  'Cosy: hop 10 goi, thung 24 hop',    (SELECT id FROM uom WHERE code = 'GOI')),
    ('QC-SNACK', 'Snack/keo le: goi, thung 30 goi',   (SELECT id FROM uom WHERE code = 'GOI'));

INSERT INTO uom_conversion (uom_group_id, uom_id, factor)
SELECT g.id, u.id, v.factor FROM (
    SELECT 'QC-12X12' AS g, 'GOI' AS u, 1 AS factor UNION ALL
    SELECT 'QC-12X12', 'HOP', 12 UNION ALL
    SELECT 'QC-12X12', 'THUNG', 144 UNION ALL
    SELECT 'QC-6X16', 'GOI', 1 UNION ALL
    SELECT 'QC-6X16', 'HOP', 6 UNION ALL
    SELECT 'QC-6X16', 'THUNG', 96 UNION ALL
    SELECT 'QC-COSY', 'GOI', 1 UNION ALL
    SELECT 'QC-COSY', 'HOP', 10 UNION ALL
    SELECT 'QC-COSY', 'THUNG', 240 UNION ALL
    SELECT 'QC-SNACK', 'GOI', 1 UNION ALL
    SELECT 'QC-SNACK', 'THUNG', 30
) v
JOIN uom_group g ON g.code = v.g
JOIN uom u ON u.code = v.u;

-- 2) Gan nhom quy doi + DVT cho san pham Orion (ban theo HOP hoac GOI, mua theo THUNG, ton kho theo GOI).
UPDATE product SET uom_group_id = (SELECT id FROM uom_group WHERE code = 'QC-12X12'),
    sale_uom_id = (SELECT id FROM uom WHERE code = 'HOP'), purchase_uom_id = (SELECT id FROM uom WHERE code = 'THUNG'),
    inventory_uom_id = (SELECT id FROM uom WHERE code = 'GOI')
WHERE code IN ('CP001', 'CP002');
UPDATE product SET uom_group_id = (SELECT id FROM uom_group WHERE code = 'QC-6X16'),
    sale_uom_id = (SELECT id FROM uom WHERE code = 'HOP'), purchase_uom_id = (SELECT id FROM uom WHERE code = 'THUNG'),
    inventory_uom_id = (SELECT id FROM uom WHERE code = 'GOI')
WHERE code IN ('CT001', 'CT002');
UPDATE product SET uom_group_id = (SELECT id FROM uom_group WHERE code = 'QC-COSY'),
    sale_uom_id = (SELECT id FROM uom WHERE code = 'HOP'), purchase_uom_id = (SELECT id FROM uom WHERE code = 'THUNG'),
    inventory_uom_id = (SELECT id FROM uom WHERE code = 'GOI')
WHERE code IN ('CS001', 'CS002');
UPDATE product SET uom_group_id = (SELECT id FROM uom_group WHERE code = 'NHOM-BANHKEO'),
    sale_uom_id = (SELECT id FROM uom WHERE code = 'HOP'), purchase_uom_id = (SELECT id FROM uom WHERE code = 'THUNG'),
    inventory_uom_id = (SELECT id FROM uom WHERE code = 'GOI')
WHERE code = 'SW001';
UPDATE product SET uom_group_id = (SELECT id FROM uom_group WHERE code = 'QC-SNACK'),
    sale_uom_id = (SELECT id FROM uom WHERE code = 'GOI'), purchase_uom_id = (SELECT id FROM uom WHERE code = 'THUNG'),
    inventory_uom_id = (SELECT id FROM uom WHERE code = 'GOI')
WHERE code IN ('OS001', 'OS002', 'MB001', 'TN001');

-- 3) Bo sung gia ban demo (theo DVT ban mac dinh) cho san pham chua co gia, vao 2 bang gia BAN hien co -
--    de chon san pham tren Don hang ban (o gia bi khoa) tra duoc gia. INSERT IGNORE: khong ghi de gia da co.
INSERT IGNORE INTO price_list_item (price_list_id, product_id, uom_id, price)
SELECT pl.id, p.id, p.sale_uom_id, v.price FROM (
    SELECT 'CT001' AS code, 45000 AS price UNION ALL
    SELECT 'CT002', 48000 UNION ALL
    SELECT 'CS001', 60000 UNION ALL
    SELECT 'CS002', 55000 UNION ALL
    SELECT 'SW001', 36000 UNION ALL
    SELECT 'OS001', 6000 UNION ALL
    SELECT 'OS002', 6000 UNION ALL
    SELECT 'MB001', 6000 UNION ALL
    SELECT 'TN001', 5000
) v
JOIN product p ON p.code = v.code
JOIN price_list pl ON pl.code IN ('BG-DAILY-C1', 'BG-CHUAN-CTY') AND pl.type = 'SALE';

-- 4) Cot DVT + so luong quy doi co so tren cac dong chung tu. Dong cu: uom_id NULL, base_quantity = quantity.
ALTER TABLE sales_order_detail
    ADD COLUMN uom_id BIGINT NULL, ADD COLUMN base_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    ADD CONSTRAINT fk_sod_uom FOREIGN KEY (uom_id) REFERENCES uom(id);
UPDATE sales_order_detail SET base_quantity = quantity;

ALTER TABLE sales_request_item
    ADD COLUMN uom_id BIGINT NULL, ADD COLUMN base_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    ADD CONSTRAINT fk_sri_uom FOREIGN KEY (uom_id) REFERENCES uom(id);
UPDATE sales_request_item SET base_quantity = quantity;

ALTER TABLE delivery_order_item
    ADD COLUMN uom_id BIGINT NULL, ADD COLUMN base_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    ADD CONSTRAINT fk_doi_uom FOREIGN KEY (uom_id) REFERENCES uom(id);
UPDATE delivery_order_item SET base_quantity = quantity;

ALTER TABLE sales_return_item
    ADD COLUMN uom_id BIGINT NULL, ADD COLUMN base_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    ADD CONSTRAINT fk_sri2_uom FOREIGN KEY (uom_id) REFERENCES uom(id);
UPDATE sales_return_item SET base_quantity = quantity;

ALTER TABLE invoice_item
    ADD COLUMN uom_id BIGINT NULL,
    ADD CONSTRAINT fk_invi_uom FOREIGN KEY (uom_id) REFERENCES uom(id);
