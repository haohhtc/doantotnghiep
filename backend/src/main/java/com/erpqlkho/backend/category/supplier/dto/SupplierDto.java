package com.erpqlkho.backend.category.supplier.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SupplierDto {

    private Long id;

    @NotBlank(message = "Ma nha cung cap khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten nha cung cap khong duoc de trong")
    private String name;

    private String foreignName;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;

    // null khi tao moi = mac dinh active=true (xu ly trong service)
    private Boolean active;
}
