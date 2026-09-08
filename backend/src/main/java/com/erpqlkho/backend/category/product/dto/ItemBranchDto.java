package com.erpqlkho.backend.category.product.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ItemBranchDto {

    @NotNull(message = "Chi nhanh khong duoc de trong")
    private Long branchId;
}
