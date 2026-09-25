package com.erpqlkho.backend.sales.entity;

import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.common.base.BaseEntity;
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

@Getter
@Setter
@Entity
@Table(name = "sales_order")
public class SalesOrder extends BaseEntity {

    @Column(name = "doc_number", nullable = false, unique = true, length = 50)
    private String docNumber;

    @Column(name = "doc_date", nullable = false)
    private LocalDate docDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    // PENDING: cho xac nhan | CONFIRMED: da xuat kho | CANCELLED: da huy
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    // PRE_ORDER: dat truoc giao sau (bat buoc ngay giao + kho Main) | SAMPLE: don hang mau, don gia = 0
    // (van tru kho, van xuat hoa don 0d) | STANDARD: don thuong - xem V35 + SalesOrderService.applyDto().
    @Column(name = "order_type", nullable = false, length = 20)
    private String orderType = "STANDARD";

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    // Nguoi bam nut Xac nhan (khac nguoi tao don) - null khi con PENDING/CANCELLED.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "confirmed_by")
    private User confirmedBy;

    // Truy vet Yeu cau ban hang goc (nullable) - don co the tao truc tiep khong qua Yeu cau
    // ban hang - xem V34 + SalesRequestService.convert().
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_request_id")
    private SalesRequest salesRequest;

    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<SalesOrderDetail> details = new ArrayList<>();
}
