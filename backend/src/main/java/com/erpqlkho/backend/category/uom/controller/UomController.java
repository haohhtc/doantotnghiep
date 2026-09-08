package com.erpqlkho.backend.category.uom.controller;

import com.erpqlkho.backend.category.uom.dto.UomDto;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uom.service.UomService;
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
@RequestMapping("/api/uoms")
@RequiredArgsConstructor
public class UomController {

    private final UomService uomService;

    @GetMapping
    public ApiResponse<List<Uom>> findAll() {
        return ApiResponse.ok(uomService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Uom> findById(@PathVariable Long id) {
        return ApiResponse.ok(uomService.findById(id));
    }

    @PostMapping
    public ApiResponse<Uom> create(@Valid @RequestBody UomDto dto) {
        return ApiResponse.ok("Tao don vi tinh thanh cong", uomService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Uom> update(@PathVariable Long id, @Valid @RequestBody UomDto dto) {
        return ApiResponse.ok("Cap nhat don vi tinh thanh cong", uomService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        uomService.delete(id);
        return ApiResponse.ok("Da xoa don vi tinh", null);
    }
}
