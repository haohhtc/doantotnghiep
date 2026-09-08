package com.erpqlkho.backend.category.routesetting.controller;

import com.erpqlkho.backend.category.routesetting.dto.RouteSettingDto;
import com.erpqlkho.backend.category.routesetting.entity.RouteSetting;
import com.erpqlkho.backend.category.routesetting.service.RouteSettingService;
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
@RequestMapping("/api/route-settings")
@RequiredArgsConstructor
public class RouteSettingController {

    private final RouteSettingService routeSettingService;

    @GetMapping
    public ApiResponse<List<RouteSetting>> findAll() {
        return ApiResponse.ok(routeSettingService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<RouteSetting> findById(@PathVariable Long id) {
        return ApiResponse.ok(routeSettingService.findById(id));
    }

    @PostMapping
    public ApiResponse<RouteSetting> create(@Valid @RequestBody RouteSettingDto dto) {
        return ApiResponse.ok("Tao giao tuyen thanh cong", routeSettingService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<RouteSetting> update(@PathVariable Long id, @Valid @RequestBody RouteSettingDto dto) {
        return ApiResponse.ok("Cap nhat giao tuyen thanh cong", routeSettingService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        routeSettingService.delete(id);
        return ApiResponse.ok("Da xoa giao tuyen", null);
    }
}
