package com.erpqlkho.backend.category.branch.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BranchDto {

    private Long id;

    @NotBlank(message = "Ma chi nhanh khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten chi nhanh khong duoc de trong")
    private String name;

    private String address;
    private String phone;

    // null khi tao moi = mac dinh active=true (xu ly trong service)
    private Boolean active;

    // Vung dia ly that (nullable) - chon theo tang Region -> Province -> District -> Ward.
    private Long regionId;
    private Long provinceId;
    private Long districtId;
    private Long wardId;
}
