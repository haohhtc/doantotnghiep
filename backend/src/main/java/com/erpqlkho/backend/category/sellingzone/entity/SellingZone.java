package com.erpqlkho.backend.category.sellingzone.entity;

import com.erpqlkho.backend.category.branch.entity.Branch;
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
@Table(name = "selling_zone")
public class SellingZone extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    // Cot text cu (nhap tay tu do) - giu lai de khong pha du lieu demo hien co, khong dung nua
    // cho ban ghi moi (thay bang regionRef/provinceRef/districtRef/wardRef ben duoi).
    @Column(length = 100)
    private String region;

    @Column(length = 100)
    private String province;

    @Column(length = 100)
    private String ward;

    // EAGER: chi la 1 ManyToOne don, tranh LazyInitializationException khi serialize
    // JSON sau khi transaction/session da dong (open-in-view: false trong application.yml)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    // Vung dia ly that (nullable) - chon theo tang Region -> Province -> District -> Ward tu
    // V11__geography.sql, thay the dan cho 3 cot text o tren.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id")
    private Region regionRef;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "province_id")
    private Province provinceRef;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id")
    private District districtRef;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ward_id")
    private Ward wardRef;
}
