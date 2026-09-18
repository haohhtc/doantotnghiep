package com.erpqlkho.backend.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SystemSettingDto {

    @NotBlank(message = "Khoa cau hinh khong duoc de trong")
    private String settingKey;

    private String settingValue;
    private String description;
}
