package com.erpqlkho.backend.category.uom.repository;

import com.erpqlkho.backend.category.uom.entity.Uom;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UomRepository extends JpaRepository<Uom, Long> {
    boolean existsByCode(String code);
}
