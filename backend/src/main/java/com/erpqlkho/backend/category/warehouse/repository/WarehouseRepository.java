package com.erpqlkho.backend.category.warehouse.repository;

import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    boolean existsByCode(String code);
}
