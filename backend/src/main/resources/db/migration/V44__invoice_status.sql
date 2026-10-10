-- Hoa don truoc gio bat bien, khong co cot trang thai. Them status de ho tro Huy hoa don (hoan
-- tra kho Van + mo lai Don giao hang ve DRAFT) ma khong pha vo du lieu cu - cac hoa don da co deu
-- mac dinh ACTIVE (dang hieu luc).
ALTER TABLE invoice
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
