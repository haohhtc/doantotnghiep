package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.StockAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockAlertRepository extends JpaRepository<StockAlert, Long> {
    Optional<StockAlert> findByProductIdAndWarehouseId(Long productId, Long warehouseId);
    List<StockAlert> findByStatus(String status);
}
