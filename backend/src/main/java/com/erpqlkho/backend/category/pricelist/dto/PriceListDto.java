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

    // STANDARD / CHANNEL / CONTRACT - mac dinh STANDARD neu de trong.
    private String type;

    private LocalDate startDate;
    private LocalDate endDate;

    // null khi tao moi = mac dinh active=true (xu ly trong service)
    private Boolean active;
}
