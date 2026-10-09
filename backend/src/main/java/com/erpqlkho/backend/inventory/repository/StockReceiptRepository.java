package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.StockReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockReceiptRepository extends JpaRepository<StockReceipt, Long> {
    boolean existsByDocNumber(String docNumber);
}
