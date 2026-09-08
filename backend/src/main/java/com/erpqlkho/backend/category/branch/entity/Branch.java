package com.erpqlkho.backend.category.branch.entity;

import com.erpqlkho.backend.category.district.entity.District;
import com.erpqlkho.backend.category.province.entity.Province;
import com.erpqlkho.backend.category.region.entity.Region;
import com.erpqlkho.backend.category.ward.entity.Ward;
import com.erpqlkho.backend.common.base.BaseEntity;
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
@Table(name = "branch")
public class Branch extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String address;

    @Column(length = 30)
    private String phone;

    @Column(nullable = false)
    private boolean active = true;

    // Vung dia ly that (nullable) - chon theo tang Region -> Province -> District -> Ward tu
    // V11__geography.sql.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id")
    private Region region;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "province_id")
    private Province province;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id")
    private District district;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ward_id")
    private Ward ward;
}
