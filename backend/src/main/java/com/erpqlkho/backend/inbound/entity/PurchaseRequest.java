package com.erpqlkho.backend.inbound.entity;

import com.erpqlkho.backend.category.supplier.entity.Supplier;
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

// Yeu cau mua hang (Purchase Request) - ghi truoc Phieu nhap hang (Goods Receipt), dung theo
// dung pattern cua Yeu cau ban hang (SalesRequest) ben Sales - xem V48 + PurchaseRequestService.
// OPEN (dang sua) -chuyen-> PENDING_APPROVAL (gui duyet, khoa sua) -chuyen-> CLOSED (da tao Phieu
// nhap hang that, DRAFT - tham chieu lai qua goodsReceipt). Chua dung gi den ton kho o day.
@Getter
@Setter
@Entity
@Table(name = "purchase_request")
public class PurchaseRequest extends BaseEntity {

    @Column(name = "doc_number", nullable = false, unique = true, length = 50)
    private String docNumber;

    @Column(name = "doc_date", nullable = false)
    private LocalDate docDate;

    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;

    @Column(name = "posting_date")
    private LocalDate postingDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(length = 500)
    private String reason;

    @Column(length = 500)
    private String remarks;

    // OPEN: dang sua | PENDING_APPROVAL: da gui duyet, khoa sua | CLOSED: da chuyen thanh Phieu
    // nhap hang (xem PurchaseRequestService.convertToGoodsReceipt())
    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    @Column(name = "subtotal_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    // Phieu nhap hang da duoc tao ra tu yeu cau nay (null neu chua convert)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "goods_receipt_id")
    private GoodsReceipt goodsReceipt;

    @OneToMany(mappedBy = "purchaseRequest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<PurchaseRequestItem> items = new ArrayList<>();
}
