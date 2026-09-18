package com.erpqlkho.backend.system.repository;

import com.erpqlkho.backend.system.entity.EmailConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailConfigRepository extends JpaRepository<EmailConfig, Long> {
}
