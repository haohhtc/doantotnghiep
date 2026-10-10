-- Bo UNIQUE tren sales_order_id: cho phep xuat hoa don MOI cho 1 don hang sau khi hoa don cu
-- da bi Huy (status=CANCELLED). Van giu index thuong de ho tro FK invoice_ibfk_1.
ALTER TABLE invoice
    ADD INDEX idx_invoice_sales_order_id (sales_order_id),
    DROP INDEX sales_order_id;
