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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Phieu tra hang NCC (gop Goods Return Request + Confirm thanh 1 buoc, tai dung y het pattern
// GoodsIssue) - xem tonghop.md muc "Purchase Order".
@Getter
@Setter
@Entity
@Table(name = "purchase_return")
public class PurchaseReturn extends BaseEntity {

    @Column(name = "doc_number", nullable = false, unique = true, length = 50)
    private String docNumber;

    @Column(name = "doc_date", nullable = false)
    private LocalDate docDate;

    @Column(name = "posting_date")
    private LocalDate postingDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    // Truy vet phieu nhap goc (nullable).
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "goods_receipt_id")
    private GoodsReceipt goodsReceipt;

    @Column(length = 255)
    private String reason;

    @Column(length = 500)
    private String remarks;

    // DRAFT: dang nhap lieu | CLOSED: da duyet, da tru ton kho
    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "purchaseReturn", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<PurchaseReturnItem> items = new ArrayList<>();
}
