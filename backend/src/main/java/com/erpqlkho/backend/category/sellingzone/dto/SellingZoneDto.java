package com.erpqlkho.backend.category.sellingzone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SellingZoneDto {

    private Long id;

    @NotBlank(message = "Ma vung ban hang khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten vung ban hang khong duoc de trong")
    private String name;

    private String region;
    private String province;
    private String ward;

    @NotNull(message = "Chi nhanh khong duoc de trong")
    private Long branchId;

    // Vung dia ly that (nullable) - chon theo tang Region -> Province -> District -> Ward.
    private Long regionId;
    private Long provinceId;
    private Long districtId;
    private Long wardId;
}
