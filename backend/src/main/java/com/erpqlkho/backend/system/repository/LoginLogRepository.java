package com.erpqlkho.backend.system.repository;

import com.erpqlkho.backend.system.entity.LoginLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginLogRepository extends JpaRepository<LoginLog, Long> {
}
