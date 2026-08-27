package com.erpqlkho.backend.category.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductDto {

    private Long id;

    @NotBlank(message = "Ma san pham khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten san pham khong duoc de trong")
    private String name;

    private String foreignName;

    @NotNull(message = "Danh muc khong duoc de trong")
    private Long categoryId;

    private String unit;

    @DecimalMin(value = "0", message = "Gia khong duoc am")
    private BigDecimal price;

    private String description;

    // null khi tao moi = mac dinh active=true (xu ly trong service)
    private Boolean active;
}
