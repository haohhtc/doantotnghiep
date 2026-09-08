package com.erpqlkho.backend.category.ward.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WardDto {

    private Long id;

    @NotBlank(message = "Ma phuong/xa khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten phuong/xa khong duoc de trong")
    private String name;

    @NotNull(message = "Quan/Huyen khong duoc de trong")
    private Long districtId;
}
