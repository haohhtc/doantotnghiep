package com.erpqlkho.backend.category.salesmantype.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesmanTypeDto {

    @NotBlank(message = "Ma loai nhan vien ban hang khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten loai nhan vien ban hang khong duoc de trong")
    private String name;

    private String description;
}
