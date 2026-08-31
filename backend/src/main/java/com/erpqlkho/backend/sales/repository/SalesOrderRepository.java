package com.erpqlkho.backend.sales.repository;

import com.erpqlkho.backend.sales.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    boolean existsByDocNumber(String docNumber);
}
