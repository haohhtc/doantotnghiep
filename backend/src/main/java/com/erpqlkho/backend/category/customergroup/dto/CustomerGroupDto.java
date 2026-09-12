package com.erpqlkho.backend.category.customergroup.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerGroupDto {

    @NotBlank(message = "Ma nhom khach hang khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten nhom khach hang khong duoc de trong")
    private String name;

    private String description;
}
