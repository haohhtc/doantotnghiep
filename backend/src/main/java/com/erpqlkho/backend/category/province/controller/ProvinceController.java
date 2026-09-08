package com.erpqlkho.backend.category.province.controller;

import com.erpqlkho.backend.category.province.dto.ProvinceDto;
import com.erpqlkho.backend.category.province.entity.Province;
import com.erpqlkho.backend.category.province.service.ProvinceService;
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
@RequestMapping("/api/provinces")
@RequiredArgsConstructor
public class ProvinceController {

    private final ProvinceService provinceService;

    // ?regionId= de loc theo Vung - bo trong thi tra toan bo.
    @GetMapping
    public ApiResponse<List<Province>> findAll(@RequestParam(required = false) Long regionId) {
        return ApiResponse.ok(provinceService.findAll(regionId));
    }

    @GetMapping("/{id}")
    public ApiResponse<Province> findById(@PathVariable Long id) {
        return ApiResponse.ok(provinceService.findById(id));
    }

    @PostMapping
    public ApiResponse<Province> create(@Valid @RequestBody ProvinceDto dto) {
        return ApiResponse.ok("Tao tinh/thanh pho thanh cong", provinceService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Province> update(@PathVariable Long id, @Valid @RequestBody ProvinceDto dto) {
        return ApiResponse.ok("Cap nhat tinh/thanh pho thanh cong", provinceService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        provinceService.delete(id);
        return ApiResponse.ok("Da xoa tinh/thanh pho", null);
    }
}
