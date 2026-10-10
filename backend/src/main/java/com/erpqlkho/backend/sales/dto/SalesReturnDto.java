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
public class SalesReturnDto {

    // De trong = tu sinh so phieu (xu ly trong service)
    private String docNumber;

    @NotNull(message = "Ngay chung tu khong duoc de trong")
    private LocalDate docDate;

    @NotNull(message = "Nhan vien ban hang khong duoc de trong")
    private Long salesmanId;

    @NotNull(message = "Kho khong duoc de trong")
    private Long warehouseId;

    // Hoa don goc (nullable) - de nguoi dung biet dang tra hang cho hoa don nao, tu dong gan lai
    // dung Don hang ban cua hoa don do vao cot sales_order_id da co san (xem SalesReturnService).
    private Long invoiceId;

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

        // Don vi tinh cua dong (Goi/Hop/Thung) - de trong = don vi co so (he so 1)
        private Long uomId;

        private String note;
    }
}
