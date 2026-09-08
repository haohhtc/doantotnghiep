package com.erpqlkho.backend.category.routemaster.repository;

import com.erpqlkho.backend.category.routemaster.entity.RouteMaster;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteMasterRepository extends JpaRepository<RouteMaster, Long> {
    boolean existsByCode(String code);
}
