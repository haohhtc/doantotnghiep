-- Doi tu quan he 1-1 (1 Don hang ban = toi da 1 Don giao hang = toi da 1 Hoa don) sang 1-nhieu:
-- 1 Don hang ban co the tach thanh nhieu Don giao hang (giao nhieu dot), 1 Don giao hang co the
-- tach thanh nhieu Hoa don (xuat hoa don tung phan). Xem InvoiceService/DeliveryOrderService.
--
-- invoice.delivery_order_id: hoa don gio gan voi DUNG 1 dot giao cu the (truoc day chi gan voi
-- sales_order_id va tu do "do" ra dot giao duy nhat - khong con dung khi co nhieu dot).
ALTER TABLE invoice
    ADD COLUMN delivery_order_id BIGINT NULL AFTER sales_order_id,
    ADD CONSTRAINT fk_invoice_delivery_order FOREIGN KEY (delivery_order_id) REFERENCES delivery_order(id);

-- invoice_item.base_quantity: truoc day hoa don luon lay NGUYEN so luong cua Don giao hang (khong
-- co chon tung phan), nen tru kho cung lay thang tu DeliveryOrderItem. Gio hoa don chi lay 1 PHAN
-- so luong da giao, nen phai tu luu lai base_quantity cua chinh dong hoa don do de tru kho dung VA
-- de tinh "da xuat hoa don bao nhieu" khi kiem tra con lai cho cac hoa don tiep theo cua cung 1 dot
-- giao. Nullable vi du lieu cu (truoc migration nay) khong co gia tri nay.
ALTER TABLE invoice_item
    ADD COLUMN base_quantity DECIMAL(18,3) NULL;
