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

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    // Dung chung 1 nhom quy doi cho ca 3 tab (chi 1 nhom quy doi/san pham) - xem V13__product_mdm.sql.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uom_group_id")
    private UomGroup uomGroup;

    // 3 tab Purchase/Sale/Inventory (moi tab 1 UOM + 1 Nhom thue rieng) - thay cho cap uom_id/
    // tax_group_id don cu, da xoa "price" va "unit" text tu do - xem V19__product_tabs_price_list_type.sql.
    // Inventory UOM la don vi ma stock.quantity dang duoc tinh theo.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "purchase_uom_id")
    private Uom purchaseUom;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "purchase_tax_group_id")
    private TaxGroup purchaseTaxGroup;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sale_uom_id")
    private Uom saleUom;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sale_tax_group_id")
    private TaxGroup saleTaxGroup;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inventory_uom_id")
    private Uom inventoryUom;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inventory_tax_group_id")
    private TaxGroup inventoryTaxGroup;
}
