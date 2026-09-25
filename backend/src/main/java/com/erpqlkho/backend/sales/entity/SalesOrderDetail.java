package com.erpqlkho.backend.sales.entity;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.fasterxml.jackson.annotation.JsonIgnore;
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

// Khong extends BaseEntity: sales_order_detail khong co created_at/updated_at (xem V4__sales.sql).
@Getter
@Setter
@Entity
@Table(name = "sales_order_detail")
public class SalesOrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // JsonIgnore: tranh vong lap vo han SalesOrder -> details -> SalesOrderDetail -> salesOrder -> details...
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;
    // Don vi tinh cua dong (null = don vi co so, he so 1) - xem V36 + UomConversionService.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uom_id")
    private Uom uom;

    // So luong quy doi ve don vi co so - dung de tru/cong kho va tinh Da dat hang.
    @Column(name = "base_quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal baseQuantity = BigDecimal.ZERO;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;
}
