package com.erpqlkho.backend.inventory.entity;

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

// Phieu nhap kho - man hinh doc lap, KHONG qua Nha cung cap (khac "Nhap hang"/GoodsReceipt da co,
// bat buoc Nha cung cap) - dung cho nhap kho noi bo/dieu chinh tang sau kiem ke/phat hien thua.
// Doi xung voi GoodsIssue (Phieu xuat kho) nhung co them DVT + Don gia tren tung dong (xem Item).
@Getter
@Setter
@Entity
@Table(name = "stock_receipt")
public class StockReceipt extends BaseEntity {

    @Column(name = "doc_number", nullable = false, unique = true, length = 50)
    private String docNumber;

    @Column(name = "doc_date", nullable = false)
    private LocalDate docDate;

    @Column(name = "posting_date")
    private LocalDate postingDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    // ADJUST / FOUND / INTERNAL / OTHER - giu dang free-text nhu GoodsIssue.reason.
    @Column(nullable = false, length = 50)
    private String reason;

    @Column(length = 500)
    private String remarks;

    // DRAFT: dang nhap lieu | CLOSED: da xac nhan, da cong ton kho
    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "stockReceipt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<StockReceiptItem> items = new ArrayList<>();
}
