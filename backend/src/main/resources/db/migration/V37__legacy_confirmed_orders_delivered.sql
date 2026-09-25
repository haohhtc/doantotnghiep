-- Don test cu duoc duyet tu thoi "Xac nhan = tru kho luon" (co giao dich kho OUT tham chieu SALES_ORDER)
-- nhung khong co Don giao hang -> bi tinh "Da dat hang" nham lan 2 (kho da tru tu truoc). Tao Don giao hang
-- da xac nhan (CLOSED) cho cac don do de het giu cho. KHONG dung den ton kho (da tru dung luc do).
INSERT INTO delivery_order (doc_number, doc_date, sales_order_id, warehouse_id, status, remarks, created_by, confirmed_by, created_at, updated_at)
SELECT CONCAT('DO-CU-', s.id), s.doc_date, s.id, s.warehouse_id, 'CLOSED',
       'Du lieu cu: don da tru kho luc duyet (truoc khi tach Don giao hang)',
       s.created_by, COALESCE(s.confirmed_by, s.created_by), s.created_at, s.updated_at
FROM sales_order s
WHERE s.status = 'CONFIRMED'
  AND NOT EXISTS (SELECT 1 FROM delivery_order d WHERE d.sales_order_id = s.id)
  AND EXISTS (SELECT 1 FROM stock_transaction t
              WHERE t.reference_type = 'SALES_ORDER' AND t.reference_id = s.id AND t.type = 'OUT');

INSERT INTO delivery_order_item (delivery_order_id, product_id, quantity, base_quantity)
SELECT d.id, sd.product_id, sd.quantity, sd.base_quantity
FROM delivery_order d
JOIN sales_order_detail sd ON sd.sales_order_id = d.sales_order_id
WHERE d.doc_number LIKE 'DO-CU-%';
