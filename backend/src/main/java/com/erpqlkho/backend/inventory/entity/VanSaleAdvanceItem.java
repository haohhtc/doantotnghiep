package com.erpqlkho.backend.inventory.entity;

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

// Khong extends BaseEntity: khong co created_at/updated_at rieng (giong GoodsIssueItem).
@Getter
@Setter
@Entity
@Table(name = "van_sale_advance_item")
public class VanSaleAdvanceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "van_sale_advance_id", nullable = false)
    private VanSaleAdvance vanSaleAdvance;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uom_id")
    private Uom uom;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    @Column(name = "base_quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal baseQuantity;
}
