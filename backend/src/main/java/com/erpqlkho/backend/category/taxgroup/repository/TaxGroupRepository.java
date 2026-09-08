package com.erpqlkho.backend.category.taxgroup.repository;

import com.erpqlkho.backend.category.taxgroup.entity.TaxGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaxGroupRepository extends JpaRepository<TaxGroup, Long> {
    boolean existsByCode(String code);
}
