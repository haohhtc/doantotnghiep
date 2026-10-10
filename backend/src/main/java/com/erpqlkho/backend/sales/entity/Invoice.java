package com.erpqlkho.backend.sales.entity;

import com.erpqlkho.backend.user.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Hoa don xuat tu 1 Sales Order da CONFIRMED - khong con UNIQUE tren sales_order_id (V45), vi 1
// don hang co the duoc xuat lai hoa don MOI sau khi hoa don cu bi Huy (xem InvoiceService). Khong
// sua gi den SalesOrder/SalesOrderDetail (xem tonghop.md) - thue chot cung 1 lan tai day, khong tinh lai.
// Khong extends BaseEntity: bang chi co created_at, khong co updated_at (hoa don khong sua duoc).
@Getter
@Setter
@Entity
@Table(name = "invoice")
public class Invoice {

    @jakarta.persistence.Id
    @jakarta.persistence.GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    // ACTIVE: dang hieu luc | CANCELLED: da huy (hoan tra Kho Van, mo lai Don giao hang ve DRAFT) -
    // xem InvoiceService.cancel(). Hoa don van giu lai ban ghi (khong xoa) de giu lich su.
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "subtotal_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotalAmount;

    @Column(name = "tax_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<InvoiceItem> items = new ArrayList<>();
}
