package com.erpqlkho.backend.sales.service;

import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.sales.entity.Invoice;
import com.erpqlkho.backend.sales.entity.InvoiceItem;
import com.erpqlkho.backend.sales.entity.SalesOrder;
import com.erpqlkho.backend.sales.entity.SalesOrderDetail;
import com.erpqlkho.backend.sales.repository.InvoiceRepository;
import com.erpqlkho.backend.sales.repository.SalesOrderRepository;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Xuat hoa don tu 1 Sales Order da CONFIRMED - chot cung thue (product.saleTaxGroup.ratePercent
// tai thoi diem xuat) vao invoice_item, KHONG dung gi den SalesOrderService/sales_order (xem
// tonghop.md). Sales Order chi hien uoc tinh thue o Frontend, khong luu gi xuong DB.
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final UserRepository userRepository;

    public List<Invoice> findAll() {
        return invoiceRepository.findAll();
    }

    public Invoice findById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay hoa don id=" + id));
    }

    @Transactional
    public Invoice createFromSalesOrder(Long salesOrderId) {
        SalesOrder order = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don hang id=" + salesOrderId));

        if (!"CONFIRMED".equals(order.getStatus())) {
            throw ApiException.conflict("Chi xuat duoc hoa don tu don hang da xac nhan (CONFIRMED)");
        }
        if (invoiceRepository.existsBySalesOrderId(salesOrderId)) {
            throw ApiException.conflict("Don hang nay da duoc xuat hoa don roi");
        }

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(resolveInvoiceNumber());
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setSalesOrder(order);
        invoice.setCreatedBy(currentUser());
        invoice.setCreatedAt(java.time.LocalDateTime.now());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        List<InvoiceItem> items = new ArrayList<>();
        for (SalesOrderDetail detail : order.getDetails()) {
            BigDecimal rate = detail.getProduct().getSaleTaxGroup() != null
                    ? detail.getProduct().getSaleTaxGroup().getRatePercent()
                    : BigDecimal.ZERO;
            BigDecimal lineSubtotal = detail.getQuantity().multiply(detail.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTax = lineSubtotal.multiply(rate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineSubtotal.add(lineTax);

            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
            item.setProduct(detail.getProduct());
            item.setQuantity(detail.getQuantity());
            item.setUnitPrice(detail.getUnitPrice());
            item.setTaxRate(rate);
            item.setLineTaxAmount(lineTax);
            item.setLineTotal(lineTotal);
            items.add(item);

            subtotal = subtotal.add(lineSubtotal);
            totalTax = totalTax.add(lineTax);
        }
        invoice.getItems().addAll(items);
        invoice.setSubtotalAmount(subtotal);
        invoice.setTaxAmount(totalTax);
        invoice.setTotalAmount(subtotal.add(totalTax));

        return invoiceRepository.save(invoice);
    }

    private String resolveInvoiceNumber() {
        return "HD" + String.format("%04d", invoiceRepository.count() + 1);
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay user dang dang nhap"));
    }
}
