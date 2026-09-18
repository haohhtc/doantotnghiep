package com.erpqlkho.backend.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailSendDto {

    @NotBlank(message = "Nguoi nhan khong duoc de trong")
    private String recipient;

    private String subject;
    private String body;
}
