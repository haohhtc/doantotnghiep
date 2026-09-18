package com.erpqlkho.backend.system.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailConfigDto {

    private String smtpHost;
    private Integer smtpPort;
    private String smtpUsername;
    private String smtpPassword;
}
