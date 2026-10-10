-- Bo UNIQUE tren sales_order_id: cho phep tao Don giao hang MOI cho 1 don hang sau khi Don giao
-- hang cu da bi Huy (status=CANCELLED) - dung pattern da ap dung cho invoice o V45. Van giu index
-- thuong de ho tro FK delivery_order_ibfk_1.
ALTER TABLE delivery_order
    ADD INDEX idx_delivery_order_sales_order_id (sales_order_id),
    DROP INDEX sales_order_id;
