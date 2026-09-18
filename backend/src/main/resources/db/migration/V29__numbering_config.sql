-- V29: Numbering Configs - noi duy nhat sinh so phieu (giong vai tro StockService), thay the
-- resolveDocNumber() hardcode rieng le o tung Service - xem tonghop.md. Seed current_sequence
-- bang dung so luong ban ghi hien co cua tung bang, de danh so tiep tuc lien tuc, KHONG bi trung
-- voi cac phieu da tao truoc do (rui ro chinh da luu y trong tonghop.md).

CREATE TABLE numbering_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_type VARCHAR(50) NOT NULL UNIQUE,
    prefix VARCHAR(10) NOT NULL,
    current_sequence INT NOT NULL DEFAULT 0,
    updated_at DATETIME
);

INSERT INTO numbering_config (doc_type, prefix, current_sequence) VALUES
    ('SALES_ORDER', 'SO', (SELECT COUNT(*) FROM sales_order)),
    ('GOODS_RECEIPT', 'PN', (SELECT COUNT(*) FROM goods_receipt)),
    ('GOODS_ISSUE', 'PX', (SELECT COUNT(*) FROM goods_issue)),
    ('INVENTORY_TRANSFER', 'DC', (SELECT COUNT(*) FROM inventory_transfer)),
    ('SALES_RETURN', 'RT', (SELECT COUNT(*) FROM sales_return)),
    ('PURCHASE_RETURN', 'PRT', (SELECT COUNT(*) FROM purchase_return)),
    ('INVOICE', 'HD', (SELECT COUNT(*) FROM invoice)),
    ('STOCK_TAKE', 'KK', (SELECT COUNT(*) FROM stock_take));
