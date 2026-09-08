package com.erpqlkho.backend.category.product.entity;

import com.erpqlkho.backend.category.productcategory.entity.ProductCategory;
import com.erpqlkho.backend.category.taxgroup.entity.TaxGroup;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uomgroup.entity.UomGroup;
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
@Table(name = "product")
public class Product extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "foreign_name")
    private String foreignName;

    // EAGER: chi la 1 ManyToOne don, tranh LazyInitializationException khi serialize
    // JSON sau khi transaction/session da dong (open-in-view: false trong application.yml)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private ProductCategory category;

    @Column(length = 30)
    private String unit;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    // MDM Product day du (nullable) - "unit" text o tren van giu lam legacy, cot moi day du
    // hon: chon Don vi tinh that + Nhom quy doi + Nhom thue - xem V13__product_mdm.sql.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uom_id")
    private Uom uom;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uom_group_id")
    private UomGroup uomGroup;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tax_group_id")
    private TaxGroup taxGroup;
}
