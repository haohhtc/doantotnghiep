package com.erpqlkho.backend.sales.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

// Xuat hoa don THANG cho Van Sale (App Van-Sale, di dong) - khac InvoiceDto (hoa don tu Don giao
// hang Pre-order): Van Sale KHONG co Don giao hang o giua - "tien trao chao muc", ban xong xuat
// hoa don luon. Chi can dung 1 Don hang ban da CONFIRMED (orderType=STANDARD, kho = Kho Van chi
// nhanh, salesman = dung NVBH ban hang) - xem InvoiceService.createVanSale().
@Getter
@Setter
public class VanSaleInvoiceDto {

    @NotNull(message = "Chua chon don hang ban")
    private Long salesOrderId;

    @NotEmpty(message = "Hoa don phai co it nhat 1 dong san pham")
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
