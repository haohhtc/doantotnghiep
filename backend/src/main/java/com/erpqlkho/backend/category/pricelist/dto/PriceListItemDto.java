package com.erpqlkho.backend.category.pricelist.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PriceListItemDto {

    @NotNull(message = "San pham khong duoc de trong")
    private Long productId;

    @NotNull(message = "Don vi tinh khong duoc de trong")
    private Long uomId;

    @NotNull(message = "Gia khong duoc de trong")
    @DecimalMin(value = "0", message = "Gia khong duoc am")
    private BigDecimal price;
}
