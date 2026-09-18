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
public class PurchaseReturnDto {

    // De trong = tu sinh so phieu (xu ly trong service)
    private String docNumber;

    @NotNull(message = "Ngay chung tu khong duoc de trong")
    private LocalDate docDate;

    private LocalDate postingDate;

    @NotNull(message = "Nha cung cap khong duoc de trong")
    private Long supplierId;

    @NotNull(message = "Kho khong duoc de trong")
    private Long warehouseId;

    private Long goodsReceiptId;

    private String reason;
    private String remarks;

    @NotEmpty(message = "Phieu tra hang phai co it nhat 1 dong san pham")
    private List<@Valid ItemDto> items;

    @Getter
    @Setter
    public static class ItemDto {

        @NotNull(message = "San pham khong duoc de trong")
        private Long productId;

        @NotNull(message = "So luong khong duoc de trong")
        private BigDecimal quantity;

        private String note;
    }
}
