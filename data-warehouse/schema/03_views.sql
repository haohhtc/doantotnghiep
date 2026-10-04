-- View ho tro Power BI - tinh san gia tri ton kho (can gia nhap binh quan, phuc tap neu viet
-- DAX tu dau trong Power BI nen tinh san o tang SQL).
-- Gia tri ton kho = ton kho snapshot moi nhat x gia nhap binh quan (tu fact_inbound) cua tung SP.
CREATE OR REPLACE VIEW v_inventory_value AS
SELECT f.product_key, f.warehouse_key, f.time_key, f.quantity_on_hand,
       COALESCE(c.avg_unit_price, 0) AS avg_unit_price,
       f.quantity_on_hand * COALESCE(c.avg_unit_price, 0) AS inventory_value
FROM fact_inventory_snapshot f
LEFT JOIN (
    SELECT product_key, AVG(unit_price) AS avg_unit_price
    FROM fact_inbound GROUP BY product_key
) c ON c.product_key = f.product_key
WHERE f.time_key = (SELECT MAX(time_key) FROM fact_inventory_snapshot);
