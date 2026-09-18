-- V25: Security Logs - ghi lai moi lan dang nhap (thanh cong/that bai) - xem tonghop.md muc
-- "Quan tri - 6 muc con thieu".

CREATE TABLE login_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
