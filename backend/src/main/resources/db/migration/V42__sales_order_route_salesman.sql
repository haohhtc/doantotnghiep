-- Luu lai Tuyen + NVBH dang phu trach tuyen do TAI DUNG NGAY dat hang (tu dong suy, khoa cung o
-- Frontend) - phuc vu bao cao doanh so/hoa hong NVBH. Cho phep NULL: khach hang co the chua gan
-- tuyen, hoac tuyen dang trong NVBH tai thoi diem do - khong chan tao don trong 2 truong hop nay.
ALTER TABLE sales_order
    ADD COLUMN route_master_id BIGINT NULL,
    ADD COLUMN salesman_id BIGINT NULL,
    ADD CONSTRAINT fk_sales_order_route_master FOREIGN KEY (route_master_id) REFERENCES route_master(id),
    ADD CONSTRAINT fk_sales_order_salesman FOREIGN KEY (salesman_id) REFERENCES employee(id);
