package com.erpqlkho.backend.sales.repository;

import com.erpqlkho.backend.sales.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    boolean existsByInvoiceNumber(String invoiceNumber);

    // V49: 1 Don giao hang co the co nhieu hoa don (xuat tung phan) nen tra ve List, khong con la
    // "1 hoa don duy nhat cua don hang" nhu truoc (xem InvoiceService.create()/cancel(),
    // DeliveryOrderService.cancel()).
    List<Invoice> findByDeliveryOrderIdAndStatusNot(Long deliveryOrderId, String status);

    List<Invoice> findBySalesOrderIdAndStatusNot(Long salesOrderId, String status);
}
