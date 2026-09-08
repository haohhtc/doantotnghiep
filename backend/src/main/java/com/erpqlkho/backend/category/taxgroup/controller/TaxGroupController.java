package com.erpqlkho.backend.category.taxgroup.controller;

import com.erpqlkho.backend.category.taxgroup.dto.TaxGroupDto;
import com.erpqlkho.backend.category.taxgroup.entity.TaxGroup;
import com.erpqlkho.backend.category.taxgroup.service.TaxGroupService;
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
@RequestMapping("/api/tax-groups")
@RequiredArgsConstructor
public class TaxGroupController {

    private final TaxGroupService taxGroupService;

    @GetMapping
    public ApiResponse<List<TaxGroup>> findAll() {
        return ApiResponse.ok(taxGroupService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<TaxGroup> findById(@PathVariable Long id) {
        return ApiResponse.ok(taxGroupService.findById(id));
    }

    @PostMapping
    public ApiResponse<TaxGroup> create(@Valid @RequestBody TaxGroupDto dto) {
        return ApiResponse.ok("Tao nhom thue thanh cong", taxGroupService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<TaxGroup> update(@PathVariable Long id, @Valid @RequestBody TaxGroupDto dto) {
        return ApiResponse.ok("Cap nhat nhom thue thanh cong", taxGroupService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        taxGroupService.delete(id);
        return ApiResponse.ok("Da xoa nhom thue", null);
    }
}
