-- Bang ghi nhan tung lan "tai phieu in xuong" tu man hinh Phieu in nhanh (/sales/printed-note) -
-- CHI insert khi bam tai xuong, khong insert khi chi bam In/xem truoc. doc_type + doc_number xac
-- dinh chung tu nao (Don giao hang = DELIVERY_NOTE hay Phieu xuat kho tong = STOCK_ISSUE) da duoc
-- tai, dung de loc Da in/Chua in - thay the print_count/last_printed_at tren delivery_order (V55),
-- vi cach do khong phan biet duoc in/tai va khong dung chung duoc cho ca Phieu xuat kho.
CREATE TABLE printed_note (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_type VARCHAR(20) NOT NULL,
    doc_number VARCHAR(50) NOT NULL,
    printed_at DATETIME NOT NULL,
    printed_by BIGINT NOT NULL,
    FOREIGN KEY (printed_by) REFERENCES user(id)
);
CREATE INDEX idx_printed_note_lookup ON printed_note (doc_type, doc_number);

ALTER TABLE delivery_order DROP COLUMN print_count;
ALTER TABLE delivery_order DROP COLUMN last_printed_at;
