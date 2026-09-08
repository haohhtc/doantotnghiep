package com.erpqlkho.backend.category.province.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProvinceDto {

    private Long id;

    @NotBlank(message = "Ma tinh/thanh pho khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten tinh/thanh pho khong duoc de trong")
    private String name;

    @NotNull(message = "Vung khong duoc de trong")
    private Long regionId;
}
