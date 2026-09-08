package com.erpqlkho.backend.category.warehouse.controller;

import com.erpqlkho.backend.category.warehouse.dto.WarehouseDto;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.service.WarehouseService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    // ?branchId= de loc theo Chi nhanh - bo trong thi tra toan bo.
    @GetMapping
    public ApiResponse<List<Warehouse>> findAll(@RequestParam(required = false) Long branchId) {
        return ApiResponse.ok(warehouseService.findAll(branchId));
    }

    @GetMapping("/{id}")
    public ApiResponse<Warehouse> findById(@PathVariable Long id) {
        return ApiResponse.ok(warehouseService.findById(id));
    }

    @PostMapping
    public ApiResponse<Warehouse> create(@Valid @RequestBody WarehouseDto dto) {
        return ApiResponse.ok("Tao kho thanh cong", warehouseService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Warehouse> update(@PathVariable Long id, @Valid @RequestBody WarehouseDto dto) {
        return ApiResponse.ok("Cap nhat kho thanh cong", warehouseService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deactivate(@PathVariable Long id) {
        warehouseService.deactivate(id);
        return ApiResponse.ok("Da xoa kho", null);
    }
}
