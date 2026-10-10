package com.erpqlkho.backend.sales.repository;

import com.erpqlkho.backend.sales.entity.SalesReturn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalesReturnRepository extends JpaRepository<SalesReturn, Long> {
    boolean existsByDocNumber(String docNumber);
    List<SalesReturn> findBySalesOrderId(Long salesOrderId);
}
