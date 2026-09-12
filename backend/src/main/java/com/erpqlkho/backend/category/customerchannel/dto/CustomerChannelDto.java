package com.erpqlkho.backend.category.customerchannel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerChannelDto {

    @NotBlank(message = "Ma kenh ban hang khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten kenh ban hang khong duoc de trong")
    private String name;

    private String description;
}
