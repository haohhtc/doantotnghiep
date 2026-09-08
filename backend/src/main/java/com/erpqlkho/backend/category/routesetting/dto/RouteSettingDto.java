package com.erpqlkho.backend.category.routesetting.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class RouteSettingDto {

    private Long id;

    @NotBlank(message = "Ma giao tuyen khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten giao tuyen khong duoc de trong")
    private String name;

    @NotNull(message = "Khung tuyen khong duoc de trong")
    private Long routeMasterId;

    @NotNull(message = "Nguoi phu trach (sales person) khong duoc de trong")
    private Long salesPersonId;

    // Nullable
    private Long manageById;

    @NotNull(message = "Ngay hieu luc khong duoc de trong")
    private LocalDate effectiveDate;

    private LocalDate endDate;
}
