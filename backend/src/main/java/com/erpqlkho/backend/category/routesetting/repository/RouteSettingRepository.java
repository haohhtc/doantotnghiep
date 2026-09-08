package com.erpqlkho.backend.category.routesetting.repository;

import com.erpqlkho.backend.category.routesetting.entity.RouteSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteSettingRepository extends JpaRepository<RouteSetting, Long> {
    boolean existsByCode(String code);
}
