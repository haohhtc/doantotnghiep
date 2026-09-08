package com.erpqlkho.backend.category.branch.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

// Chieu nguoc cua ItemBranchDto: gan 1 san pham vao 1 chi nhanh (xem BranchController /products).
@Getter
@Setter
public class BranchProductDto {

    @NotNull(message = "San pham khong duoc de trong")
    private Long productId;
}
