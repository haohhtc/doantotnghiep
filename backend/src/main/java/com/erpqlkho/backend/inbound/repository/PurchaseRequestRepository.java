package com.erpqlkho.backend.inbound.repository;

import com.erpqlkho.backend.inbound.entity.PurchaseRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {
    boolean existsByDocNumber(String docNumber);
}
