package com.erpqlkho.backend.category.district.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DistrictDto {

    private Long id;

    @NotBlank(message = "Ma quan/huyen khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten quan/huyen khong duoc de trong")
    private String name;

    @NotNull(message = "Tinh/Thanh pho khong duoc de trong")
    private Long provinceId;
}
