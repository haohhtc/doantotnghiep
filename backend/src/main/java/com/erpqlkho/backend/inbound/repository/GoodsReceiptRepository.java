package com.erpqlkho.backend.inbound.repository;

import com.erpqlkho.backend.inbound.entity.GoodsReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Long> {
    boolean existsByDocNumber(String docNumber);
}
