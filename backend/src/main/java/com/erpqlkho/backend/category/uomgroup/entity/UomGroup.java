package com.erpqlkho.backend.category.uomgroup.entity;

import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

// Nhom Don vi tinh - vd "Nhom DVT Banh keo" gom Goi/Hop/Thung, quy doi theo baseUom
// (xem UomConversion.factor - luon tinh so voi baseUom nay, khong phai don vi lien ke).
@Getter
@Setter
@Entity
@Table(name = "uom_group")
public class UomGroup extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "base_uom_id", nullable = false)
    private Uom baseUom;
}
