package com.erpqlkho.backend.sales.repository;

import com.erpqlkho.backend.sales.entity.DeliveryOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {
    boolean existsByDocNumber(String docNumber);

    // V49: 1 Don hang ban co the co nhieu Don giao hang (giao nhieu dot) nen tra ve List, khong con
    // la "1 don giao duy nhat cua don hang" nhu truoc (xem DeliveryOrderService.create() tinh "con
    // lai bao nhieu chua giao", InvoiceService tim dot giao can xuat hoa don).
    List<DeliveryOrder> findBySalesOrderIdAndStatusNot(Long salesOrderId, String status);

    // Dung de phan biet hoa don Van Sale (V51, khong bao gio co Don giao hang) voi hoa don cu
    // truoc V49 (deliveryOrder null nhung van co 1 Don giao hang that su, xem resolveDeliveryOrder())
    // - xem InvoiceService.cancel().
    boolean existsBySalesOrderId(Long salesOrderId);
}
