package com.erpqlkho.backend.inventory.entity;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "stock_alert")
public class StockAlert extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "min_quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal minQuantity;

    // ACTIVE: dang duoi nguong, can nhap them | RESOLVED: da het canh bao
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";
}
