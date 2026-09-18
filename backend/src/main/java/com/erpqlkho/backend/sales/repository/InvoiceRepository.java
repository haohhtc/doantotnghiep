package com.erpqlkho.backend.sales.repository;

import com.erpqlkho.backend.sales.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    boolean existsByInvoiceNumber(String invoiceNumber);
    boolean existsBySalesOrderId(Long salesOrderId);
    Optional<Invoice> findBySalesOrderId(Long salesOrderId);
}
