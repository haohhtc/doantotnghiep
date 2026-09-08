package com.erpqlkho.backend.category.uomgroup.entity;

import com.erpqlkho.backend.category.uom.entity.Uom;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

// 1 dong quy doi trong 1 UomGroup: "1 don vi nay = factor don vi GOC cua nhom".
// Khong extends BaseEntity: bang phu thuoc UomGroup, chi gan/go (giong RouteMasterOutlet).
@Getter
@Setter
@Entity
@Table(name = "uom_conversion")
public class UomConversion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uom_group_id", nullable = false)
    private UomGroup uomGroup;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uom_id", nullable = false)
    private Uom uom;

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal factor;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
