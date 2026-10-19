-- So nhat ky bien dong Kho NV (giong stock_transaction cho bang stock) - de tinh duoc
-- "Dau ngay / Da nhan / Da xuat / Con lai" theo tung ngay cho app Van-Sale (yeu cau cua tv2,
-- xem dalam.md). Khong sua employee_stock.quantity (van la so du chay hien tai) - bang nay
-- chi la log bat bien, cong don lai theo ngay khi can hien thi.
CREATE TABLE employee_stock_transaction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    type VARCHAR(10) NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    reference_type VARCHAR(30) NOT NULL,
    reference_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);
