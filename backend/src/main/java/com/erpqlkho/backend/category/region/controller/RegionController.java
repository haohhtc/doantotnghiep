package com.erpqlkho.backend.category.region.controller;

import com.erpqlkho.backend.category.region.dto.RegionDto;
import com.erpqlkho.backend.category.region.entity.Region;
import com.erpqlkho.backend.category.region.service.RegionService;
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
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    @GetMapping
    public ApiResponse<List<Region>> findAll() {
        return ApiResponse.ok(regionService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Region> findById(@PathVariable Long id) {
        return ApiResponse.ok(regionService.findById(id));
    }

    @PostMapping
    public ApiResponse<Region> create(@Valid @RequestBody RegionDto dto) {
        return ApiResponse.ok("Tao vung thanh cong", regionService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Region> update(@PathVariable Long id, @Valid @RequestBody RegionDto dto) {
        return ApiResponse.ok("Cap nhat vung thanh cong", regionService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        regionService.delete(id);
        return ApiResponse.ok("Da xoa vung", null);
    }
}
