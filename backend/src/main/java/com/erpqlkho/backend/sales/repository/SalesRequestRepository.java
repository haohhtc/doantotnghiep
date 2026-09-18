package com.erpqlkho.backend.sales.repository;

import com.erpqlkho.backend.sales.entity.SalesRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalesRequestRepository extends JpaRepository<SalesRequest, Long> {
    boolean existsByDocNumber(String docNumber);
}
