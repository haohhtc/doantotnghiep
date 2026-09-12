package com.erpqlkho.backend.category.customer.entity;

import com.erpqlkho.backend.category.customerchannel.entity.CustomerChannel;
import com.erpqlkho.backend.category.customergroup.entity.CustomerGroup;
import com.erpqlkho.backend.category.district.entity.District;
import com.erpqlkho.backend.category.pricelist.entity.PriceList;
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
@Table(name = "customer")
public class Customer extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(length = 30)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(length = 500)
    private String address;

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

    // Bang gia rieng ap dung cho khach hang nay (nullable) - xem V14__price_list.sql.
    // Uu tien cao nhat trong PriceListService.lookupPrice (dong vai Contract Price).
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "price_list_id")
    private PriceList priceList;

    // Nhom khach hang / Kenh ban hang (nullable) - chi mang tinh mo ta/phan loai, khong tu lien
    // ket voi price_list.type - xem V15__customer_group_channel.sql.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "group_id")
    private CustomerGroup group;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "channel_id")
    private CustomerChannel channel;
}
