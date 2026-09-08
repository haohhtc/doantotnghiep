package com.erpqlkho.backend.category.region.entity;

import com.erpqlkho.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

// Cap cao nhat cua Vung dia ly (Region -> Province -> District -> Ward).
@Getter
@Setter
@Entity
@Table(name = "region")
public class Region extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;
}
