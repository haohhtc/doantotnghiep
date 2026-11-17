-- Theo doi so lan in + lan in gan nhat cua Don giao hang - phuc vu man hinh "Phieu in nhanh"
-- (Sales Order / Picking List / Delivery Note Printing) in Phieu giao hang + Phieu xuat kho tong.
ALTER TABLE delivery_order ADD COLUMN print_count INT NOT NULL DEFAULT 0;
ALTER TABLE delivery_order ADD COLUMN last_printed_at DATETIME NULL;
