-- Luu lai ai la nguoi bam Xac nhan don hang (khac voi created_by la nguoi tao don).
ALTER TABLE sales_order
    ADD COLUMN confirmed_by BIGINT NULL AFTER created_by,
    ADD CONSTRAINT fk_sales_order_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES user(id);
