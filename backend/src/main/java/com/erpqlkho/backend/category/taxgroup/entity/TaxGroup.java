package com.erpqlkho.backend.category.taxgroup.entity;

import com.erpqlkho.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "tax_group")
public class TaxGroup extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "rate_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal ratePercent;
}
