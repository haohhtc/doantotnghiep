package com.erpqlkho.backend.system.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// Cau hinh THAM KHAO: "loai chung tu nao can role gi duyet" - CHUA thuc su chan/thay doi logic
// Service hien tai (giu nguyen DRAFT/CLOSED/PENDING... nhu hien co, tranh rui ro pha vo hanh vi
// da test ky) - xem tonghop.md.
@Getter
@Setter
@Entity
@Table(name = "approval_config")
public class ApprovalConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doc_type", nullable = false, unique = true, length = 50)
    private String docType;

    @Column(name = "require_approval", nullable = false)
    private boolean requireApproval = false;

    @Column(name = "approver_role", length = 50)
    private String approverRole;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
