package com.erpqlkho.backend.category.productgroup.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductGroupDto {

    @NotBlank(message = "Ma nhom san pham khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten nhom san pham khong duoc de trong")
    private String name;

    private String description;
}
