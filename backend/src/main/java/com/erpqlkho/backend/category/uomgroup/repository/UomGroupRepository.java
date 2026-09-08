package com.erpqlkho.backend.category.uomgroup.repository;

import com.erpqlkho.backend.category.uomgroup.entity.UomGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UomGroupRepository extends JpaRepository<UomGroup, Long> {
    boolean existsByCode(String code);
}
