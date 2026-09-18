package com.erpqlkho.backend.system.repository;

import com.erpqlkho.backend.system.entity.EmailLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
}
