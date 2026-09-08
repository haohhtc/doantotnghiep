package com.erpqlkho.backend.category.company.entity;

import com.erpqlkho.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

// Cap to chuc cao nhat (Company -> Branch -> Warehouse). Chi co dung 1 ban ghi (seed trong
// V12__company_setup.sql) - do an mot cong ty duy nhat, khong da-tenant.
@Getter
@Setter
@Entity
@Table(name = "company")
public class Company extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(length = 500)
    private String address;

    @Column(length = 30)
    private String phone;
}
