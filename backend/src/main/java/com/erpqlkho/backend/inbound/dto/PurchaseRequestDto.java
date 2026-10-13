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
public class PurchaseRequestDto {

    private Long id;

    // De trong = tu sinh ma (xu ly trong service)
    private String docNumber;

    @NotNull(message = "Ngay tao khong duoc de trong")
    private LocalDate docDate;

    @NotNull(message = "Ngay yeu cau khong duoc de trong")
    private LocalDate requestDate;

    private LocalDate postingDate;

    @NotNull(message = "Nha cung cap khong duoc de trong")
    private Long supplierId;

    @NotNull(message = "Kho nha phan phoi khong duoc de trong")
    private Long warehouseId;

    private String reason;

    private String remarks;

    @NotEmpty(message = "Yeu cau mua hang phai co it nhat 1 dong san pham")
    private List<@Valid DetailDto> items;

    @Getter
    @Setter
    public static class DetailDto {

        @NotNull(message = "San pham khong duoc de trong")
        private Long productId;

        @NotNull(message = "So luong khong duoc de trong")
        private BigDecimal quantity;

        @NotNull(message = "Don gia khong duoc de trong")
        private BigDecimal unitPrice;

        private BigDecimal discountPercent;

        private String note;
    }
}
