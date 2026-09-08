package com.erpqlkho.backend.category.sellingzone.controller;

import com.erpqlkho.backend.category.sellingzone.dto.SellingZoneDto;
import com.erpqlkho.backend.category.sellingzone.entity.SellingZone;
import com.erpqlkho.backend.category.sellingzone.service.SellingZoneService;
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
@RequestMapping("/api/selling-zones")
@RequiredArgsConstructor
public class SellingZoneController {

    private final SellingZoneService sellingZoneService;

    @GetMapping
    public ApiResponse<List<SellingZone>> findAll() {
        return ApiResponse.ok(sellingZoneService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<SellingZone> findById(@PathVariable Long id) {
        return ApiResponse.ok(sellingZoneService.findById(id));
    }

    @PostMapping
    public ApiResponse<SellingZone> create(@Valid @RequestBody SellingZoneDto dto) {
        return ApiResponse.ok("Tao vung ban hang thanh cong", sellingZoneService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<SellingZone> update(@PathVariable Long id, @Valid @RequestBody SellingZoneDto dto) {
        return ApiResponse.ok("Cap nhat vung ban hang thanh cong", sellingZoneService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        sellingZoneService.delete(id);
        return ApiResponse.ok("Da xoa vung ban hang", null);
    }
}
