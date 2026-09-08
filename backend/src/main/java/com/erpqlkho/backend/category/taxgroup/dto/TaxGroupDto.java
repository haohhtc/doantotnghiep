package com.erpqlkho.backend.category.taxgroup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TaxGroupDto {

    private Long id;

    @NotBlank(message = "Ma nhom thue khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten nhom thue khong duoc de trong")
    private String name;

    @NotNull(message = "Thue suat khong duoc de trong")
    private BigDecimal ratePercent;
}
