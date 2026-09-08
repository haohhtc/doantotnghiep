package com.erpqlkho.backend.category.ward.controller;

import com.erpqlkho.backend.category.ward.dto.WardDto;
import com.erpqlkho.backend.category.ward.entity.Ward;
import com.erpqlkho.backend.category.ward.service.WardService;
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
@RequestMapping("/api/wards")
@RequiredArgsConstructor
public class WardController {

    private final WardService wardService;

    // ?districtId= de loc theo Quan/Huyen - bo trong thi tra toan bo.
    @GetMapping
    public ApiResponse<List<Ward>> findAll(@RequestParam(required = false) Long districtId) {
        return ApiResponse.ok(wardService.findAll(districtId));
    }

    @GetMapping("/{id}")
    public ApiResponse<Ward> findById(@PathVariable Long id) {
        return ApiResponse.ok(wardService.findById(id));
    }

    @PostMapping
    public ApiResponse<Ward> create(@Valid @RequestBody WardDto dto) {
        return ApiResponse.ok("Tao phuong/xa thanh cong", wardService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Ward> update(@PathVariable Long id, @Valid @RequestBody WardDto dto) {
        return ApiResponse.ok("Cap nhat phuong/xa thanh cong", wardService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        wardService.delete(id);
        return ApiResponse.ok("Da xoa phuong/xa", null);
    }
}
