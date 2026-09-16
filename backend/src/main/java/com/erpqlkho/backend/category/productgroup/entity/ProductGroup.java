package com.erpqlkho.backend.category.productgroup.entity;

import com.erpqlkho.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

// "Nhom san pham" that (M:N) - xem V20__product_group.sql. Khac ProductCategory (da doi nhan
// hien thi thanh "Thuoc tinh", van la FK 1-N).
@Getter
@Setter
@Entity
@Table(name = "product_group")
public class ProductGroup extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;
}
