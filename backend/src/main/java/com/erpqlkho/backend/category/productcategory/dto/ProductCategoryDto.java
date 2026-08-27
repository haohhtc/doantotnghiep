package com.erpqlkho.backend.category.productcategory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductCategoryDto {

    private Long id;

    @NotBlank(message = "Ma danh muc khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten danh muc khong duoc de trong")
    private String name;

    // null = danh muc goc (khong co cha)
    private Long parentId;
}
