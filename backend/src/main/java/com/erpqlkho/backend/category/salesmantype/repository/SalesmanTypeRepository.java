package com.erpqlkho.backend.category.salesmantype.repository;

import com.erpqlkho.backend.category.salesmantype.entity.SalesmanType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalesmanTypeRepository extends JpaRepository<SalesmanType, Long> {
    boolean existsByCode(String code);
}
