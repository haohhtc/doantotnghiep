package com.erpqlkho.backend.inventory.entity;

import com.erpqlkho.backend.category.product.entity.Product;
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

// Khong extends BaseEntity: stock_take_detail khong co created_at/updated_at (xem V5__inventory.sql).
@Getter
@Setter
@Entity
@Table(name = "stock_take_detail")
public class StockTakeDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // JsonIgnore: tranh vong lap vo han StockTake -> details -> StockTakeDetail -> stockTake -> details...
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_take_id", nullable = false)
    private StockTake stockTake;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "system_quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal systemQuantity;

    @Column(name = "actual_quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal actualQuantity;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal difference;
}
