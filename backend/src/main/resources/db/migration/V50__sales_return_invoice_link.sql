-- Phieu tra hang truoc day chi luu lai sales_order_id (suy ra tu hoa don luc tao, qua truong
-- invoiceId o DTO) nhung KHONG giu lai chinh hoa don do - nen khi 1 don hang co NHIEU hoa don
-- (V49, giao/xuat nhieu dot), khong the biet chinh xac phieu tra gan voi hoa don nao, chi biet
-- gan voi CA DON HANG -> tag "Tra hang" o man Hoa don se hien SAI cho ca cac hoa don khac cua
-- cung don hang. Them cot nay de luu lai dung hoa don goc, cho phep so khop chinh xac.
ALTER TABLE sales_return
    ADD COLUMN invoice_id BIGINT NULL,
    ADD CONSTRAINT fk_sales_return_invoice FOREIGN KEY (invoice_id) REFERENCES invoice (id);
