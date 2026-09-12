package com.erpqlkho.backend.category.customergroup.repository;

import com.erpqlkho.backend.category.customergroup.entity.CustomerGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerGroupRepository extends JpaRepository<CustomerGroup, Long> {
    boolean existsByCode(String code);
}
