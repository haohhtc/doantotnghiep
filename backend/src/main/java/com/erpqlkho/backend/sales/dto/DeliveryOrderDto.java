package com.erpqlkho.backend.sales.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class DeliveryOrderDto {

    // De trong = tu sinh so phieu (xu ly trong service)
    private String docNumber;

    // De trong = mac dinh ngay hom nay (xu ly trong service)
    private LocalDate docDate;

    // Bat buoc khi tao moi - don hang ban da CONFIRMED de tao lenh giao. Bo qua khi update.
    private Long salesOrderId;

    // De trong khi tao moi = mac dinh lay kho cua Don hang ban goc.
    private Long warehouseId;

    private String remarks;

    // De trong khi tao moi = tu dong copy dung so luong da dat tu Don hang ban (co the sua lai
    // truoc khi Xac nhan de phan anh so luong giao THUC TE, VD giao thieu do het hang).
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
