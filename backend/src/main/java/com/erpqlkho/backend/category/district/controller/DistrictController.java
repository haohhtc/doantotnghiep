package com.erpqlkho.backend.category.district.controller;

import com.erpqlkho.backend.category.district.dto.DistrictDto;
import com.erpqlkho.backend.category.district.entity.District;
import com.erpqlkho.backend.category.district.service.DistrictService;
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
@RequestMapping("/api/districts")
@RequiredArgsConstructor
public class DistrictController {

    private final DistrictService districtService;

    // ?provinceId= de loc theo Tinh/Thanh pho - bo trong thi tra toan bo.
    @GetMapping
    public ApiResponse<List<District>> findAll(@RequestParam(required = false) Long provinceId) {
        return ApiResponse.ok(districtService.findAll(provinceId));
    }

    @GetMapping("/{id}")
    public ApiResponse<District> findById(@PathVariable Long id) {
        return ApiResponse.ok(districtService.findById(id));
    }

    @PostMapping
    public ApiResponse<District> create(@Valid @RequestBody DistrictDto dto) {
        return ApiResponse.ok("Tao quan/huyen thanh cong", districtService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<District> update(@PathVariable Long id, @Valid @RequestBody DistrictDto dto) {
        return ApiResponse.ok("Cap nhat quan/huyen thanh cong", districtService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        districtService.delete(id);
        return ApiResponse.ok("Da xoa quan/huyen", null);
    }
}
