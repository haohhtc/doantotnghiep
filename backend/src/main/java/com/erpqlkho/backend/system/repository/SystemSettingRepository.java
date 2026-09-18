package com.erpqlkho.backend.system.repository;

import com.erpqlkho.backend.system.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {
    boolean existsBySettingKey(String settingKey);
}
