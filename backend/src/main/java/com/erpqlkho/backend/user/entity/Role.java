package com.erpqlkho.backend.user.entity;

import com.erpqlkho.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "role")
public class Role extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code; // ADMIN, WAREHOUSE_MANAGER, SALES_STAFF, ...

    @Column(nullable = false, length = 100)
    private String name;

    private String description;
}
