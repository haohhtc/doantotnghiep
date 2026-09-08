package com.erpqlkho.backend.category.company.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompanyDto {

    @NotBlank(message = "Ma cong ty khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten cong ty khong duoc de trong")
    private String name;

    private String taxCode;
    private String address;
    private String phone;
}
