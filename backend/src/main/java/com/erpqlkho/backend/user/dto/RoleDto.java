package com.erpqlkho.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleDto {

    private Long id;

    @NotBlank(message = "Ma vai tro khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten vai tro khong duoc de trong")
    private String name;

    private String description;
}
