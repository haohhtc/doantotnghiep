ALTER TABLE stock_take
    ADD COLUMN employee_id BIGINT NULL,
    ADD CONSTRAINT fk_stock_take_employee FOREIGN KEY (employee_id) REFERENCES employee (id);
