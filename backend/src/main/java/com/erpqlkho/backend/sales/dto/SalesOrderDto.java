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
public class SalesOrderDto {

    private Long id;

    // De trong = tu sinh so don (xu ly trong service)
    private String docNumber;

    @NotNull(message = "Ngay dat hang khong duoc de trong")
    private LocalDate docDate;

    @NotNull(message = "Khach hang khong duoc de trong")
    private Long customerId;

    @NotNull(message = "Kho xuat khong duoc de trong")
    private Long warehouseId;

    @NotEmpty(message = "Don hang phai co it nhat 1 dong san pham")
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
