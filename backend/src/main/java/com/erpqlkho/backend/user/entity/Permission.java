package com.erpqlkho.backend.user.entity;

import com.erpqlkho.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Quyen chi tiet theo module, vd: "PRODUCT_VIEW", "PRODUCT_EDIT", "SALES_ORDER_CONFIRM".
 * Gan vao Role qua bang trung gian role_permission (xem V1__init_schema.sql).
 */
@Getter
@Setter
@Entity
@Table(name = "permission")
public class Permission extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;
}
