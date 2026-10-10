package com.erpqlkho.backend.sales.entity;

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

// Don giao hang (DO) - tach rieng khoi Don hang ban (SO) theo dung chuoi DMS goc: SO duyet xong
// moi tao duoc DO, DO cho sua so luong GIAO THUC TE (co the it hon so dat) truoc khi Xac nhan.
// Xac nhan DO (DRAFT -> CLOSED) moi la luc thuc su tru ton kho - xem SalesOrderService.confirm()
// (chi con duyet don, khong tru kho nua) va DeliveryOrderService.confirm().
@Getter
@Setter
@Entity
@Table(name = "delivery_order")
public class DeliveryOrder extends BaseEntity {

    @Column(name = "doc_number", nullable = false, unique = true, length = 50)
    private String docNumber;

    @Column(name = "doc_date", nullable = false)
    private LocalDate docDate;

    // 1 SO toi da 1 DO dang hoat dong (khong CANCELLED) cung luc - khong con UNIQUE cung o DB (V46)
    // vi SO co the duoc tao DO MOI sau khi DO cu bi Huy (xem DeliveryOrderService).
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    // Kho Van da nhan hang khi Xac nhan giao (V38). null = don giao cu, da tru thang ton Main.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "van_warehouse_id")
    private Warehouse vanWarehouse;

    @Column(length = 500)
    private String remarks;

    // DRAFT: dang chuan bi/cho sua so luong giao | CLOSED: da xac nhan giao, da tru ton kho
    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "confirmed_by")
    private User confirmedBy;

    @OneToMany(mappedBy = "deliveryOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<DeliveryOrderItem> items = new ArrayList<>();
}
