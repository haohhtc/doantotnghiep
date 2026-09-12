-- V14: Bang gia (Price List) - Price Lists + Standard/Channel/Contract Price.
-- type chi mang tinh mo ta/nhan (STANDARD/CHANNEL/CONTRACT), khong tu doi logic tra cuu -
-- logic tra gia luon uu tien customer.price_list_id -> branch.price_list_id -> product.price
-- (xem PriceListService.lookupPrice).

CREATE TABLE price_list (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- Gia theo tung cap (product, uom) - 1 san pham co the co nhieu dong gia khac nhau theo don vi
-- tinh (VD gia theo GOI khac gia theo THUNG) trong cung 1 bang gia.
CREATE TABLE price_list_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    price_list_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    uom_id BIGINT NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_price_list_item (price_list_id, product_id, uom_id),
    FOREIGN KEY (price_list_id) REFERENCES price_list(id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (uom_id) REFERENCES uom(id)
);

ALTER TABLE branch
    ADD COLUMN price_list_id BIGINT NULL,
    ADD FOREIGN KEY (price_list_id) REFERENCES price_list(id);

ALTER TABLE customer
    ADD COLUMN price_list_id BIGINT NULL,
    ADD FOREIGN KEY (price_list_id) REFERENCES price_list(id);
