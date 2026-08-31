package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
}
