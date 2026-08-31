-- V6: Du lieu mau san pham Orion (banh keo/snack thuc te tai VN) de demo module Danh muc
-- voi du lieu that qua API /api/products, /api/product-categories thay vi mock frontend.

INSERT INTO product_category (code, name, parent_id) VALUES
    ('BANHKEO', 'Banh keo', NULL),
    ('SNACK', 'Snack', NULL);

-- Subquery boc qua 1 bang derived (SELECT ... FROM (SELECT ...) AS x) vi MySQL khong cho
-- INSERT INTO product_category ma lai SELECT truc tiep tu chinh bang product_category.
INSERT INTO product_category (code, name, parent_id) VALUES
    ('CHOCOPIE', 'Chocopie', (SELECT id FROM (SELECT id FROM product_category WHERE code = 'BANHKEO') AS p)),
    ('CUSTAS', 'Custas', (SELECT id FROM (SELECT id FROM product_category WHERE code = 'BANHKEO') AS p)),
    ('COSY', 'Cosy', (SELECT id FROM (SELECT id FROM product_category WHERE code = 'BANHKEO') AS p)),
    ('SWING', 'Swing', (SELECT id FROM (SELECT id FROM product_category WHERE code = 'BANHKEO') AS p)),
    ('OSTAR', 'O''Star', (SELECT id FROM (SELECT id FROM product_category WHERE code = 'SNACK') AS p)),
    ('MARINEBOY', 'Marine Boy', (SELECT id FROM (SELECT id FROM product_category WHERE code = 'SNACK') AS p)),
    ('TOONIES', 'Toonies', (SELECT id FROM (SELECT id FROM product_category WHERE code = 'SNACK') AS p));

INSERT INTO product (code, name, foreign_name, category_id, unit, price, description, active) VALUES
    ('CP001', 'Banh Chocopie hop 12 cai 468g', 'Choco Pie', (SELECT id FROM product_category WHERE code = 'CHOCOPIE'), 'HOP', 45000, '12 cai/hop', TRUE),
    ('CP002', 'Banh Chocopie Dark hop 12 cai 456g', 'Choco Pie Dark', (SELECT id FROM product_category WHERE code = 'CHOCOPIE'), 'HOP', 48000, '12 cai/hop', TRUE),
    ('CT001', 'Banh Custas hop 6 cai 297g', 'Custas Cake', (SELECT id FROM product_category WHERE code = 'CUSTAS'), 'HOP', 35000, '6 cai/hop', TRUE),
    ('CT002', 'Banh Custas Choco hop 6 cai 318g', 'Custas Choco', (SELECT id FROM product_category WHERE code = 'CUSTAS'), 'HOP', 36000, '6 cai/hop', TRUE),
    ('CS001', 'Banh quy Cosy Marie 300g', 'Cosy Marie Biscuit', (SELECT id FROM product_category WHERE code = 'COSY'), 'GOI', 18000, '', TRUE),
    ('CS002', 'Banh quy Cosy Kem Sua 200g', 'Cosy Cream Biscuit', (SELECT id FROM product_category WHERE code = 'COSY'), 'GOI', 15000, '', TRUE),
    ('SW001', 'Keo Swing Chocolate 168g', 'Swing Chocolate Stick', (SELECT id FROM product_category WHERE code = 'SWING'), 'GOI', 22000, '', TRUE),
    ('OS001', 'Snack O''Star vi tom cay 40g', 'O''Star Spicy Shrimp', (SELECT id FROM product_category WHERE code = 'OSTAR'), 'GOI', 7000, '', TRUE),
    ('OS002', 'Snack O''Star vi bo nuong 40g', 'O''Star Grilled Beef', (SELECT id FROM product_category WHERE code = 'OSTAR'), 'GOI', 7000, '', TRUE),
    ('MB001', 'Snack Marine Boy vi muc 40g', 'Marine Boy Squid', (SELECT id FROM product_category WHERE code = 'MARINEBOY'), 'GOI', 6500, '', TRUE),
    ('TN001', 'Toonies phomai que 30g', 'Toonies Cheese Stick', (SELECT id FROM product_category WHERE code = 'TOONIES'), 'GOI', 6000, '', TRUE);
