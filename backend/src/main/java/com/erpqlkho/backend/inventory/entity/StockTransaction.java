package com.erpqlkho.backend.inventory.entity;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Khong extends BaseEntity: bang stock_transaction chi co created_at, khong co updated_at
// (day la log bat bien, khong sua sau khi tao - xem V5__inventory.sql).
@Getter
@Setter
@Entity
@Table(name = "stock_transaction")
public class StockTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    // IN: nhap hang | OUT: xuat ban | ADJUST: dieu chinh sau kiem ke
    @Column(nullable = false, length = 10)
    private String type;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    // GOODS_RECEIPT / SALES_ORDER / STOCK_TAKE - tro ve nguon goc bien dong
    @Column(name = "reference_type", nullable = false, length = 30)
    private String referenceType;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
