package com.erpqlkho.backend.sales.repository;

import com.erpqlkho.backend.sales.entity.DeliveryOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {
    boolean existsByDocNumber(String docNumber);
    boolean existsBySalesOrderIdAndStatusNot(Long salesOrderId, String status);
    Optional<DeliveryOrder> findBySalesOrderIdAndStatusNot(Long salesOrderId, String status);
}
