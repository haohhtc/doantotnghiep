package com.erpqlkho.backend.category.uom.entity;

import com.erpqlkho.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

// Don vi tinh co so (Goi/Hop/Thung...) - xem uom_group/uom_conversion de biet quy doi giua cac don vi.
@Getter
@Setter
@Entity
@Table(name = "uom")
public class Uom extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;
}
