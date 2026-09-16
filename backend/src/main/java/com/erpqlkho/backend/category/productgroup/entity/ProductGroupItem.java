package com.erpqlkho.backend.category.productgroup.entity;

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

import java.time.LocalDateTime;

// 1 dong: 1 San pham thuoc 1 Nhom san pham. Khong extends BaseEntity: chi gan/go, giong
// UomConversion/PriceListItem.
@Getter
@Setter
@Entity
@Table(name = "product_group_item")
public class ProductGroupItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_group_id", nullable = false)
    private ProductGroup productGroup;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
