package com.erpqlkho.backend.category.customer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerDto {

    private Long id;

    @NotBlank(message = "Ma khach hang khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten khach hang khong duoc de trong")
    private String name;

    private String phone;
    private String email;
    private String address;

    // null khi tao moi = mac dinh active=true (xu ly trong service)
    private Boolean active;

    // Vung dia ly that (nullable) - chon theo tang Region -> Province -> District -> Ward.
    private Long regionId;
    private Long provinceId;
    private Long districtId;
    private Long wardId;

    // Bang gia rieng ap dung cho khach hang (nullable) - xem V14__price_list.sql.
    private Long priceListId;

    // Nhom khach hang / Kenh ban hang (nullable) - xem V15__customer_group_channel.sql.
    private Long groupId;
    private Long channelId;
}
