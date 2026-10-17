package com.erpqlkho.backend.inventory.dto;

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
public class VanSaleReturnDto {

    private Long id;

    // De trong = tu sinh ma (xu ly trong service)
    private String docNumber;

    @NotNull(message = "Ngay chung tu khong duoc de trong")
    private LocalDate docDate;

    @NotNull(message = "Chua chon nhan vien tra hang")
    private Long employeeId;

    private String reason;

    private String remarks;

    @NotEmpty(message = "Phieu tra hang phai co it nhat 1 dong san pham")
    private List<@Valid ItemDto> items;

    @Getter
    @Setter
    public static class ItemDto {

        @NotNull(message = "San pham khong duoc de trong")
        private Long productId;

        private Long uomId;

        @NotNull(message = "So luong khong duoc de trong")
        private BigDecimal quantity;
    }
}
