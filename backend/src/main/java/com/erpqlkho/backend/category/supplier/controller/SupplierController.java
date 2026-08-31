package com.erpqlkho.backend.category.supplier.controller;

import com.erpqlkho.backend.category.supplier.dto.SupplierDto;
import com.erpqlkho.backend.category.supplier.entity.Supplier;
import com.erpqlkho.backend.category.supplier.service.SupplierService;
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
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ApiResponse<List<Supplier>> findAll() {
        return ApiResponse.ok(supplierService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Supplier> findById(@PathVariable Long id) {
        return ApiResponse.ok(supplierService.findById(id));
    }

    @PostMapping
    public ApiResponse<Supplier> create(@Valid @RequestBody SupplierDto dto) {
        return ApiResponse.ok("Tao nha cung cap thanh cong", supplierService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Supplier> update(@PathVariable Long id, @Valid @RequestBody SupplierDto dto) {
        return ApiResponse.ok("Cap nhat nha cung cap thanh cong", supplierService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deactivate(@PathVariable Long id) {
        supplierService.deactivate(id);
        return ApiResponse.ok("Da ngung hop tac nha cung cap", null);
    }
}
