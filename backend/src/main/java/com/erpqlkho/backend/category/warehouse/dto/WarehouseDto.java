package com.erpqlkho.backend.category.warehouse.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WarehouseDto {

    private Long id;

    @NotBlank(message = "Ma kho khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten kho khong duoc de trong")
    private String name;

    private String address;

    // MAIN / VAN / DAMAGE / CONSIGNMENT - de trong = mac dinh MAIN (xu ly trong service)
    private String warehouseType;

    private Long managerId;

    // null khi tao moi = mac dinh active=true (xu ly trong service)
    private Boolean active;
}
