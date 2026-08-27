package com.erpqlkho.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDto {

    private Long id;

    @NotBlank(message = "Ten dang nhap khong duoc de trong")
    private String username;

    // Chi bat buoc khi tao moi; khi cap nhat de trong = giu nguyen mat khau cu (xu ly trong service)
    private String password;

    private String fullName;
    private String email;

    @NotBlank(message = "Vai tro khong duoc de trong")
    private String roleCode;

    private String status;
}
