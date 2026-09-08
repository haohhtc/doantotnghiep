package com.erpqlkho.backend.category.uomgroup.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UomConversionDto {

    @NotNull(message = "Don vi tinh khong duoc de trong")
    private Long uomId;

    @NotNull(message = "He so quy doi khong duoc de trong")
    private BigDecimal factor;
}
