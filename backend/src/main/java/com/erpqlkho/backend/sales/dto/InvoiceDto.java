package com.erpqlkho.backend.sales.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

// Xuat hoa don TU DUNG 1 dot giao hang cu the (V49 - truoc day chi can salesOrderId vi mac dinh
// 1 don chi co 1 dot giao, gio co the co nhieu dot nen phai chi ro). Chon tung dong/so luong muon
// xuat (co the chi la 1 PHAN cua dot giao do, phan con lai xuat hoa don sau).
@Getter
@Setter
public class InvoiceDto {

    @NotNull(message = "Chua chon dot giao hang can xuat hoa don")
    private Long deliveryOrderId;

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
