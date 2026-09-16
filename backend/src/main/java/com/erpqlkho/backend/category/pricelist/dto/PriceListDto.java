package com.erpqlkho.backend.category.pricelist.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PriceListDto {

    @NotBlank(message = "Ma bang gia khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten bang gia khong duoc de trong")
    private String name;

    // PURCHASE / SALE - bat buoc, khong con mac dinh STANDARD (da bo cac loai
    // STANDARD/CHANNEL/CONTRACT cu) - xem V19__product_tabs_price_list_type.sql.
    @NotBlank(message = "Loai bang gia khong duoc de trong")
    private String type;

    private LocalDate startDate;
    private LocalDate endDate;

    // null khi tao moi = mac dinh active=true (xu ly trong service)
    private Boolean active;
}
