package com.erpqlkho.backend.inbound.repository;

import com.erpqlkho.backend.inbound.entity.PurchaseReturn;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseReturnRepository extends JpaRepository<PurchaseReturn, Long> {
    boolean existsByDocNumber(String docNumber);
}
