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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Dieu chuyen kho - 2 buoc xac nhan that giong DMS that: DRAFT -> (kho nguon xac nhan xuat) ->
// IN_TRANSIT -> (kho dich xac nhan nhan) -> CLOSED. Xem GoodsIssue cho pattern tuong tu (1 buoc).
@Getter
@Setter
@Entity
@Table(name = "inventory_transfer")
public class InventoryTransfer extends BaseEntity {

    @Column(name = "doc_number", nullable = false, unique = true, length = 50)
    private String docNumber;

    @Column(name = "doc_date", nullable = false)
    private LocalDate docDate;

    @Column(name = "posting_date")
    private LocalDate postingDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "from_warehouse_id", nullable = false)
    private Warehouse fromWarehouse;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "to_warehouse_id", nullable = false)
    private Warehouse toWarehouse;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_employee_id")
    private User salesEmployee;

    @Column(nullable = false, length = 50)
    private String reason;

    @Column(length = 500)
    private String remarks;

    // DRAFT: dang nhap lieu | IN_TRANSIT: kho nguon da xac nhan xuat | CLOSED: kho dich da xac nhan nhan
    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "inventoryTransfer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<InventoryTransferItem> items = new ArrayList<>();
}
