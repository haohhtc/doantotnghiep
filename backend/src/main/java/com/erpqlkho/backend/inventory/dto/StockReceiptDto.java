package com.erpqlkho.backend.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class StockReceiptDto {

    private Long id;

    // De trong = tu sinh so phieu (xu ly trong service)
    private String docNumber;

    @NotNull(message = "Ngay chung tu khong duoc de trong")
    private LocalDate docDate;

    private LocalDate postingDate;

    @NotNull(message = "Kho nhan khong duoc de trong")
    private Long warehouseId;

    @NotBlank(message = "Ly do nhap khong duoc de trong")
    private String reason;

    private String remarks;

    @NotEmpty(message = "Phieu nhap phai co it nhat 1 dong san pham")
    private List<@Valid ItemDto> items;

    @Getter
    @Setter
    public static class ItemDto {

        @NotNull(message = "San pham khong duoc de trong")
        private Long productId;

        @NotNull(message = "So luong khong duoc de trong")
        private BigDecimal quantity;

        // Don vi tinh cua dong - de trong = don vi co so (he so 1)
        private Long uomId;

        @NotNull(message = "Don gia khong duoc de trong")
        private BigDecimal unitPrice;
    }
}
