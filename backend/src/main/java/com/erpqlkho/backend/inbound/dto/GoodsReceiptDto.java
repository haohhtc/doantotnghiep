package com.erpqlkho.backend.inbound.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class GoodsReceiptDto {

    private Long id;

    // De trong = tu sinh so phieu (xu ly trong service)
    private String docNumber;

    @NotNull(message = "Ngay chung tu khong duoc de trong")
    private LocalDate docDate;

    private LocalDate postingDate;

    @NotNull(message = "Nha cung cap khong duoc de trong")
    private Long supplierId;

    @NotNull(message = "Kho khong duoc de trong")
    private Long warehouseId;

    private String remarks;

    @NotEmpty(message = "Phieu nhap phai co it nhat 1 dong san pham")
    private List<@Valid DetailDto> details;

    @Getter
    @Setter
    public static class DetailDto {

        @NotNull(message = "San pham khong duoc de trong")
        private Long productId;

        @NotNull(message = "So luong khong duoc de trong")
        private BigDecimal quantity;

        @NotNull(message = "Don gia khong duoc de trong")
        private BigDecimal unitPrice;
    }
}
