package com.erpqlkho.backend.category.productcategory.controller;

import com.erpqlkho.backend.category.productcategory.dto.ProductCategoryDto;
import com.erpqlkho.backend.category.productcategory.entity.ProductCategory;
import com.erpqlkho.backend.category.productcategory.service.ProductCategoryService;
import com.erpqlkho.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/product-categories")
@RequiredArgsConstructor
public class ProductCategoryController {

    private final ProductCategoryService productCategoryService;

    @GetMapping
    public ApiResponse<List<ProductCategory>> findAll() {
        return ApiResponse.ok(productCategoryService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductCategory> findById(@PathVariable Long id) {
        return ApiResponse.ok(productCategoryService.findById(id));
    }

    @PostMapping
    public ApiResponse<ProductCategory> create(@Valid @RequestBody ProductCategoryDto dto) {
        return ApiResponse.ok("Tao danh muc thanh cong", productCategoryService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductCategory> update(@PathVariable Long id, @Valid @RequestBody ProductCategoryDto dto) {
        return ApiResponse.ok("Cap nhat danh muc thanh cong", productCategoryService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        productCategoryService.delete(id);
        return ApiResponse.ok("Da xoa danh muc", null);
    }
}
