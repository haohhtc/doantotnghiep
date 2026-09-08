package com.erpqlkho.backend.category.uomgroup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UomGroupDto {

    private Long id;

    @NotBlank(message = "Ma nhom don vi tinh khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten nhom don vi tinh khong duoc de trong")
    private String name;

    @NotNull(message = "Don vi goc khong duoc de trong")
    private Long baseUomId;
}
