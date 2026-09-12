package com.erpqlkho.backend.category.salesmantype.controller;

import com.erpqlkho.backend.category.salesmantype.dto.SalesmanTypeDto;
import com.erpqlkho.backend.category.salesmantype.entity.SalesmanType;
import com.erpqlkho.backend.category.salesmantype.service.SalesmanTypeService;
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
@RequestMapping("/api/salesman-types")
@RequiredArgsConstructor
public class SalesmanTypeController {

    private final SalesmanTypeService salesmanTypeService;

    @GetMapping
    public ApiResponse<List<SalesmanType>> findAll() {
        return ApiResponse.ok(salesmanTypeService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<SalesmanType> findById(@PathVariable Long id) {
        return ApiResponse.ok(salesmanTypeService.findById(id));
    }

    @PostMapping
    public ApiResponse<SalesmanType> create(@Valid @RequestBody SalesmanTypeDto dto) {
        return ApiResponse.ok("Tao loai nhan vien ban hang thanh cong", salesmanTypeService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<SalesmanType> update(@PathVariable Long id, @Valid @RequestBody SalesmanTypeDto dto) {
        return ApiResponse.ok("Cap nhat loai nhan vien ban hang thanh cong", salesmanTypeService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        salesmanTypeService.delete(id);
        return ApiResponse.ok("Da xoa loai nhan vien ban hang", null);
    }
}
