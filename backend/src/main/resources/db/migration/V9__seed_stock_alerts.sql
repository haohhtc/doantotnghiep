-- V9: Nguong canh bao ton kho mau (INV-05) - khop voi ton kho that hien tai de demo duoc ngay.
-- CP001 (Chocopie) dang co ton = 68 tai KHO-ORION-BD -> nguong 70 se ACTIVE ngay.
-- CT001 (Custas) chua tung nhap hang (ton = 0) -> nguong 5 cung ACTIVE ngay.

INSERT INTO stock_alert (product_id, warehouse_id, min_quantity, status) VALUES
    ((SELECT id FROM product WHERE code = 'CP001'), (SELECT id FROM warehouse WHERE code = 'KHO-ORION-BD'), 70, 'ACTIVE'),
    ((SELECT id FROM product WHERE code = 'CT001'), (SELECT id FROM warehouse WHERE code = 'KHO-ORION-BD'), 5, 'ACTIVE');
