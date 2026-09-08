package com.erpqlkho.backend.category.uom.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UomDto {

    private Long id;

    @NotBlank(message = "Ma don vi tinh khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten don vi tinh khong duoc de trong")
    private String name;
}
