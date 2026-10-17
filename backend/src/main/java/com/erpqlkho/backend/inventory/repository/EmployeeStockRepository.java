package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.EmployeeStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeStockRepository extends JpaRepository<EmployeeStock, Long> {
    Optional<EmployeeStock> findByEmployeeIdAndProductId(Long employeeId, Long productId);
    List<EmployeeStock> findByEmployeeId(Long employeeId);
}
