package com.erpqlkho.backend.category.product.controller;

import com.erpqlkho.backend.category.product.dto.ProductDto;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.service.ProductService;
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
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<List<Product>> findAll() {
        return ApiResponse.ok(productService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Product> findById(@PathVariable Long id) {
        return ApiResponse.ok(productService.findById(id));
    }

    @PostMapping
    public ApiResponse<Product> create(@Valid @RequestBody ProductDto dto) {
        return ApiResponse.ok("Tao san pham thanh cong", productService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Product> update(@PathVariable Long id, @Valid @RequestBody ProductDto dto) {
        return ApiResponse.ok("Cap nhat san pham thanh cong", productService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deactivate(@PathVariable Long id) {
        productService.deactivate(id);
        return ApiResponse.ok("Da ngung kinh doanh san pham", null);
    }
}
