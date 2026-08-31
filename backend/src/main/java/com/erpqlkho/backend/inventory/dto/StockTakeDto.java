package com.erpqlkho.backend.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class StockTakeDto {

    private Long id;

    // De trong = tu sinh ma (xu ly trong service)
    private String code;

    @NotNull(message = "Kho kiem ke khong duoc de trong")
    private Long warehouseId;

    @NotEmpty(message = "Dot kiem ke phai co it nhat 1 dong san pham")
    private List<@Valid DetailDto> details;

    @Getter
    @Setter
    public static class DetailDto {

        @NotNull(message = "San pham khong duoc de trong")
        private Long productId;

        @NotNull(message = "So luong thuc te khong duoc de trong")
        private BigDecimal actualQuantity;
    }
}
