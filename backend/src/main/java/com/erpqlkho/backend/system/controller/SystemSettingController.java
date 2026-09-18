package com.erpqlkho.backend.system.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.system.dto.SystemSettingDto;
import com.erpqlkho.backend.system.entity.SystemSetting;
import com.erpqlkho.backend.system.service.SystemSettingService;
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
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService systemSettingService;

    @GetMapping
    public ApiResponse<List<SystemSetting>> findAll() {
        return ApiResponse.ok(systemSettingService.findAll());
    }

    @PostMapping
    public ApiResponse<SystemSetting> create(@Valid @RequestBody SystemSettingDto dto) {
        return ApiResponse.ok("Tao cau hinh thanh cong", systemSettingService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<SystemSetting> update(@PathVariable Long id, @Valid @RequestBody SystemSettingDto dto) {
        return ApiResponse.ok("Cap nhat cau hinh thanh cong", systemSettingService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        systemSettingService.delete(id);
        return ApiResponse.ok("Da xoa cau hinh", null);
    }
}
