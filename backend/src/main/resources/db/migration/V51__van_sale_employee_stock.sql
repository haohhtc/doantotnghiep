-- App Van-Sale (di dong, cho NVBH di tuyen) - xem dalam.md. "Kho NV" KHONG phai kho song song:
-- la phan chia nho THEO TUNG NGUOI ben trong Kho Van cua chi nhanh da co san. Cong tat ca
-- employee_stock cua cac NVBH cung chi nhanh = dung bang stock cua Kho Van chi nhanh do (khong
-- sua bang stock hien co - bang nay chi la so phu).
CREATE TABLE employee_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    updated_at DATETIME NULL,
    UNIQUE KEY uq_employee_stock_employee_product (employee_id, product_id),
    FOREIGN KEY (employee_id) REFERENCES employee(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);

-- Ung hang: NVBH nhan hang tu Kho Main nap len "xe" truoc khi di tuyen. Chuyen Main->Van CHI NHANH
-- (giong Dieu chuyen kho) + cong them employee_stock cua dung nguoi ung. 1 buoc duyet (DRAFT ->
-- CLOSED), khong can 2 ben xac nhan nhu Dieu chuyen kho (chi 1 NVBH thao tac).
CREATE TABLE van_sale_advance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    employee_id BIGINT NOT NULL,
    reason VARCHAR(255),
    remarks VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    FOREIGN KEY (employee_id) REFERENCES employee(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE van_sale_advance_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    van_sale_advance_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    uom_id BIGINT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    base_quantity DECIMAL(18,3) NOT NULL,
    FOREIGN KEY (van_sale_advance_id) REFERENCES van_sale_advance(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (uom_id) REFERENCES uom(id)
);

-- Tra hang: NVBH tra hang con du cuoi ngay ve Kho Main. Chieu nguoc lai Ung hang: Van->Main chi
-- nhanh + tru employee_stock cua dung nguoi tra (chan neu vuot so dang co).
CREATE TABLE van_sale_return (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_date DATE NOT NULL,
    employee_id BIGINT NOT NULL,
    reason VARCHAR(255),
    remarks VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    FOREIGN KEY (employee_id) REFERENCES employee(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE van_sale_return_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    van_sale_return_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    uom_id BIGINT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    base_quantity DECIMAL(18,3) NOT NULL,
    FOREIGN KEY (van_sale_return_id) REFERENCES van_sale_return(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (uom_id) REFERENCES uom(id)
);

INSERT INTO numbering_config (doc_type, prefix, current_sequence) VALUES
    ('VAN_SALE_ADVANCE', 'UH', 0),
    ('VAN_SALE_RETURN', 'TH', 0);
