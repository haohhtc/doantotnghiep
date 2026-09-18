-- V30: Login Device Management - RUI RO CAO NHAT trong nhom Quan tri (dung vao JwtAuthFilter,
-- chay cho MOI request co xac thuc) - xem tonghop.md. Khong luu token goc, chi luu token_hash
-- (SHA-256).

CREATE TABLE active_session (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address VARCHAR(50),
    login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
