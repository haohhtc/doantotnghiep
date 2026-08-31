package com.erpqlkho.backend.category.customer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerDto {

    private Long id;

    @NotBlank(message = "Ma khach hang khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten khach hang khong duoc de trong")
    private String name;

    private String phone;
    private String email;
    private String address;

    // null khi tao moi = mac dinh active=true (xu ly trong service)
    private Boolean active;
}
