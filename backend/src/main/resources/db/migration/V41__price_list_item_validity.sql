ALTER TABLE price_list_item
    ADD COLUMN start_date DATE NULL,
    ADD COLUMN end_date DATE NULL;

UPDATE price_list_item pli
    JOIN price_list pl ON pl.id = pli.price_list_id
    SET pli.start_date = COALESCE(pl.start_date, '2026-01-01'),
        pli.end_date = pl.end_date;

UPDATE price_list_item SET start_date = '2026-01-01' WHERE start_date IS NULL;

ALTER TABLE price_list_item
    MODIFY COLUMN start_date DATE NOT NULL;

-- FK (price_list_id) dang dung uq_price_list_item lam index ho tro - phai tao index thay the
-- truoc khi xoa, neu khong MySQL se bao loi 1553 (khong cho xoa index dang phuc vu FK).
ALTER TABLE price_list_item
    ADD INDEX idx_price_list_item_price_list_id (price_list_id);

ALTER TABLE price_list_item
    DROP INDEX uq_price_list_item;

ALTER TABLE price_list
    DROP COLUMN start_date,
    DROP COLUMN end_date;
