package com.erpqlkho.backend.category.employee.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EmployeeDto {

    // NVBH / NV
    @NotBlank(message = "Loai nhan vien khong duoc de trong")
    private String type;

    @NotBlank(message = "Ma nhan vien khong duoc de trong")
    private String code;

    @NotBlank(message = "Ho ten khong duoc de trong")
    private String fullName;

    private String phone;
    private String email;
    private String gender;
    private LocalDate birthDate;
    private String address;
    private String idCardNumber;
    private String taxCode;
    private Long positionId;
    private LocalDate hireDate;
    private LocalDate resignDate;
    private Boolean deliveryMan;

    // null khi tao moi = mac dinh active=true (xu ly trong service)
    private Boolean active;

    // Tu dong gan user (nullable) - khong bat buoc 1 Employee phai co tai khoan dang nhap.
    private Long userId;
}
