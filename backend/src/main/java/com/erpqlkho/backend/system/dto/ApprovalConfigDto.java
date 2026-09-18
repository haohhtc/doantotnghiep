package com.erpqlkho.backend.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalConfigDto {

    @NotBlank(message = "Loai chung tu khong duoc de trong")
    private String docType;

    private Boolean requireApproval;
    private String approverRole;
}
