package com.erpqlkho.backend.category.warehouse.entity;

import com.erpqlkho.backend.common.base.BaseEntity;
import com.erpqlkho.backend.user.entity.User;
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
@Table(name = "warehouse")
public class Warehouse extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String address;

    // MAIN / VAN / DAMAGE / CONSIGNMENT (xem V2__master_data.sql)
    @Column(name = "warehouse_type", nullable = false, length = 20)
    private String warehouseType = "MAIN";

    // EAGER: chi la 1 ManyToOne don, tranh LazyInitializationException khi serialize
    // JSON sau khi transaction/session da dong (open-in-view: false trong application.yml)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(nullable = false)
    private boolean active = true;
}
