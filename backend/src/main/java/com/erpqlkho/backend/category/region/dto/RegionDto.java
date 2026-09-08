package com.erpqlkho.backend.category.region.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegionDto {

    private Long id;

    @NotBlank(message = "Ma vung khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten vung khong duoc de trong")
    private String name;
}
