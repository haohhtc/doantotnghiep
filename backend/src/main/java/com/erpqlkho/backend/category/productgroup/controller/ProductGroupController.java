package com.erpqlkho.backend.category.productgroup.controller;

import com.erpqlkho.backend.category.productgroup.dto.ProductGroupDto;
import com.erpqlkho.backend.category.productgroup.dto.ProductGroupItemDto;
import com.erpqlkho.backend.category.productgroup.entity.ProductGroup;
import com.erpqlkho.backend.category.productgroup.entity.ProductGroupItem;
import com.erpqlkho.backend.category.productgroup.service.ProductGroupService;
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
@RequestMapping("/api/product-groups")
@RequiredArgsConstructor
public class ProductGroupController {

    private final ProductGroupService productGroupService;

    @GetMapping
    public ApiResponse<List<ProductGroup>> findAll() {
        return ApiResponse.ok(productGroupService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductGroup> findById(@PathVariable Long id) {
        return ApiResponse.ok(productGroupService.findById(id));
    }

    @PostMapping
    public ApiResponse<ProductGroup> create(@Valid @RequestBody ProductGroupDto dto) {
        return ApiResponse.ok("Tao nhom san pham thanh cong", productGroupService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductGroup> update(@PathVariable Long id, @Valid @RequestBody ProductGroupDto dto) {
        return ApiResponse.ok("Cap nhat nhom san pham thanh cong", productGroupService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        productGroupService.delete(id);
        return ApiResponse.ok("Da xoa nhom san pham", null);
    }

    @GetMapping("/{id}/items")
    public ApiResponse<List<ProductGroupItem>> findItems(@PathVariable Long id) {
        return ApiResponse.ok(productGroupService.findItems(id));
    }

    @PostMapping("/{id}/items")
    public ApiResponse<ProductGroupItem> addItem(@PathVariable Long id, @Valid @RequestBody ProductGroupItemDto dto) {
        return ApiResponse.ok("Da them san pham vao nhom", productGroupService.addItem(id, dto));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ApiResponse<Void> removeItem(@PathVariable Long id, @PathVariable Long itemId) {
        productGroupService.removeItem(id, itemId);
        return ApiResponse.ok("Da go san pham khoi nhom", null);
    }
}
