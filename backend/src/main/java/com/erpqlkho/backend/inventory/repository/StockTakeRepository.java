package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.StockTake;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockTakeRepository extends JpaRepository<StockTake, Long> {
    boolean existsByCode(String code);
}
