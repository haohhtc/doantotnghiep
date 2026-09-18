package com.erpqlkho.backend.system.repository;

import com.erpqlkho.backend.system.entity.NumberingConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NumberingConfigRepository extends JpaRepository<NumberingConfig, Long> {
    Optional<NumberingConfig> findByDocType(String docType);
}
