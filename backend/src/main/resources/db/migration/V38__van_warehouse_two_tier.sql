-- Mo hinh kho 2 tang: Xac nhan Don giao hang chuyen hang tu Kho Main sang Kho Van cua CUNG chi nhanh
-- (Main giam ton thuc te, Van tang), Hoa don moi tru ton thuc te o Kho Van.
-- van_warehouse_id: kho Van da nhan hang khi xac nhan giao. NULL = don giao xac nhan theo cach cu (da tru
-- thang ton Main, chua qua Kho Van) -> luc xuat hoa don KHONG tru ton them (tranh tru 2 lan).
ALTER TABLE delivery_order
    ADD COLUMN van_warehouse_id BIGINT NULL,
    ADD CONSTRAINT fk_delivery_order_van_wh FOREIGN KEY (van_warehouse_id) REFERENCES warehouse(id);

-- Moi chi nhanh phai co dung 1 Kho Van (chi nhanh tao tay truoc day chi co Kho Chinh, VD CN_HN).
INSERT INTO warehouse (code, name, warehouse_type, active, branch_id)
SELECT CONCAT(b.code, 'VWH01'), CONCAT('Kho xe tải - ', b.name), 'VAN', 1, b.id
FROM branch b
WHERE NOT EXISTS (SELECT 1 FROM warehouse w WHERE w.branch_id = b.id AND w.warehouse_type = 'VAN')
  AND NOT EXISTS (SELECT 1 FROM warehouse w2 WHERE w2.code = CONCAT(b.code, 'VWH01'));
