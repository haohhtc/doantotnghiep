-- V28: Email Config - KHONG gui email that (tranh rui ro fail luc demo + ro ri thong tin dang
-- nhap email), gia lap bang cach ghi vao email_log thay vi goi SMTP that - xem tonghop.md.

CREATE TABLE email_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    smtp_host VARCHAR(255),
    smtp_port INT,
    smtp_username VARCHAR(255),
    smtp_password VARCHAR(255),
    updated_at DATETIME
);

CREATE TABLE email_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    body VARCHAR(2000),
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
