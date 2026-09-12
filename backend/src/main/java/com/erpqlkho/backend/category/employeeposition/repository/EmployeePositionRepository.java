package com.erpqlkho.backend.category.employeeposition.repository;

import com.erpqlkho.backend.category.employeeposition.entity.EmployeePosition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeePositionRepository extends JpaRepository<EmployeePosition, Long> {
    boolean existsByCode(String code);
}
