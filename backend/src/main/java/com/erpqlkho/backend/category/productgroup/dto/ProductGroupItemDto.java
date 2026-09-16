package com.erpqlkho.backend.category.productgroup.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductGroupItemDto {

    @NotNull(message = "San pham khong duoc de trong")
    private Long productId;
}
