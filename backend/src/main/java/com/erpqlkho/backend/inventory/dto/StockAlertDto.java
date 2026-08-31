package com.erpqlkho.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class StockAlertDto {

    private Long id;

    @NotNull(message = "San pham khong duoc de trong")
    private Long productId;

    @NotNull(message = "Kho khong duoc de trong")
    private Long warehouseId;

    @NotNull(message = "Nguong toi thieu khong duoc de trong")
    private BigDecimal minQuantity;
}
