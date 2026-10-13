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

// Hoa don xuat tu DUNG 1 dot giao hang cu the (deliveryOrder, V49) - 1 Don hang ban co the co nhieu
// dot giao, 1 dot giao co the tach thanh nhieu hoa don (xuat tung phan) nen khong con suy duoc
// "dot giao" tu rieng salesOrderId nhu truoc. Khong con UNIQUE tren sales_order_id (V45), vi 1 don
// hang co the duoc xuat nhieu hoa don (nhieu dot giao, hoac xuat lai sau khi huy). Khong sua gi den
// SalesOrder/SalesOrderDetail (xem tonghop.md) - thue chot cung 1 lan tai day, khong tinh lai.
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

    // Dot giao hang cu the ma hoa don nay xuat tu do (V49) - 1 Don hang ban co the co nhieu dot
    // giao, hoa don phai gan dung 1 dot thi moi tinh duoc "da xuat hoa don bao nhieu" cho dot do.
    // Nullable vi hoa don cu (truoc V49) chua tung gan - code moi luon set gia tri nay.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "delivery_order_id")
    private DeliveryOrder deliveryOrder;

    // ACTIVE: dang hieu luc | CANCELLED: da huy (hoan tra Kho Van theo dung so cua hoa don nay) -
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
