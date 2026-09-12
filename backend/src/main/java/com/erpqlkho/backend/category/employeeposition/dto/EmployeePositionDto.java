package com.erpqlkho.backend.category.employeeposition.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmployeePositionDto {

    @NotBlank(message = "Ma chuc vu khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten chuc vu khong duoc de trong")
    private String name;

    private String description;
}
