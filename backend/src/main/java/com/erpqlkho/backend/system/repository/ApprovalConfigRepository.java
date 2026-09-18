package com.erpqlkho.backend.system.repository;

import com.erpqlkho.backend.system.entity.ApprovalConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalConfigRepository extends JpaRepository<ApprovalConfig, Long> {
    boolean existsByDocType(String docType);
}
