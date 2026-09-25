-- Buoc 2: Loai don (PRE_ORDER/SAMPLE/STANDARD) + Ngay giao hang tren Don hang ban; Tra hang gan
-- theo Nhan vien ban hang (salesman) thay vi Khach hang. Giu nguyen cot customer_id/sales_order_id
-- cua sales_return (chi cho phep NULL) de khong mat du lieu cu, UI/DTO khong dung nua.
ALTER TABLE sales_order
    ADD COLUMN order_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD' AFTER status,
    ADD COLUMN delivery_date DATE NULL AFTER order_type;

ALTER TABLE sales_return
    MODIFY COLUMN customer_id BIGINT NULL,
    ADD COLUMN salesman_id BIGINT NULL AFTER customer_id,
    ADD CONSTRAINT fk_sales_return_salesman FOREIGN KEY (salesman_id) REFERENCES employee(id);
