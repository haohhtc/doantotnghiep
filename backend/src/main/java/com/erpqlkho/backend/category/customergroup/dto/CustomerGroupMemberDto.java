package com.erpqlkho.backend.category.customergroup.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerGroupMemberDto {

    @NotNull(message = "Khach hang khong duoc de trong")
    private Long customerId;
}
