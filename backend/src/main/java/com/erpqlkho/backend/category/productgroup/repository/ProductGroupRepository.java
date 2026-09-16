package com.erpqlkho.backend.category.productgroup.repository;

import com.erpqlkho.backend.category.productgroup.entity.ProductGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductGroupRepository extends JpaRepository<ProductGroup, Long> {
    boolean existsByCode(String code);
}
