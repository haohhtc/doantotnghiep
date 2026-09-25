package com.erpqlkho.backend.sales.dto;

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
public class SalesRequestDto {

    // De trong = tu sinh so phieu (xu ly trong service)
    private String docNumber;

    @NotNull(message = "Ngay chung tu khong duoc de trong")
    private LocalDate docDate;

    @NotNull(message = "Khach hang khong duoc de trong")
    private Long customerId;

    private String remarks;

    @NotEmpty(message = "Yeu cau ban hang phai co it nhat 1 dong san pham")
    private List<@Valid ItemDto> items;

    @Getter
    @Setter
    public static class ItemDto {

        @NotNull(message = "San pham khong duoc de trong")
        private Long productId;

        @NotNull(message = "So luong khong duoc de trong")
        private BigDecimal quantity;

        // Don vi tinh cua dong (Goi/Hop/Thung) - de trong = don vi co so (he so 1)
        private Long uomId;

        @NotNull(message = "Don gia khong duoc de trong")
        private BigDecimal unitPrice;
    }
}
