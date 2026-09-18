-- V27: Approval Process - chi cau hinh mo ta (chua thuc su chan/thay doi logic Service hien tai),
-- giu nguyen trang thai DRAFT/CLOSED/PENDING... nhu hien co de tranh rui ro - xem tonghop.md.

CREATE TABLE approval_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_type VARCHAR(50) NOT NULL UNIQUE,
    require_approval BOOLEAN NOT NULL DEFAULT FALSE,
    approver_role VARCHAR(50),
    updated_at DATETIME
);
