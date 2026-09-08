package com.erpqlkho.backend.category.routemaster.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class RouteMasterDto {

    private Long id;

    @NotBlank(message = "Ma khung tuyen khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten khung tuyen khong duoc de trong")
    private String name;

    private String type;
    private String channel;
    private String sellingCategory;

    @NotNull(message = "Vung ban hang khong duoc de trong")
    private Long sellingZoneId;

    @NotNull(message = "Chi nhanh khong duoc de trong")
    private Long branchId;

    // Nullable - gia tri mac dinh cua tuyen
    private Long manageById;
    private Long salesmanId;

    @NotNull(message = "Ngay hieu luc khong duoc de trong")
    private LocalDate effectiveDate;

    private LocalDate endDate;
}
