package com.erpqlkho.backend.category.uomgroup.controller;

import com.erpqlkho.backend.category.uomgroup.dto.UomConversionDto;
import com.erpqlkho.backend.category.uomgroup.dto.UomGroupDto;
import com.erpqlkho.backend.category.uomgroup.entity.UomConversion;
import com.erpqlkho.backend.category.uomgroup.entity.UomGroup;
import com.erpqlkho.backend.category.uomgroup.service.UomGroupService;
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
@RequestMapping("/api/uom-groups")
@RequiredArgsConstructor
public class UomGroupController {

    private final UomGroupService uomGroupService;

    @GetMapping
    public ApiResponse<List<UomGroup>> findAll() {
        return ApiResponse.ok(uomGroupService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<UomGroup> findById(@PathVariable Long id) {
        return ApiResponse.ok(uomGroupService.findById(id));
    }

    @PostMapping
    public ApiResponse<UomGroup> create(@Valid @RequestBody UomGroupDto dto) {
        return ApiResponse.ok("Tao nhom don vi tinh thanh cong", uomGroupService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<UomGroup> update(@PathVariable Long id, @Valid @RequestBody UomGroupDto dto) {
        return ApiResponse.ok("Cap nhat nhom don vi tinh thanh cong", uomGroupService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        uomGroupService.delete(id);
        return ApiResponse.ok("Da xoa nhom don vi tinh", null);
    }

    // Quy doi don vi trong nhom: gan/go 1 don vi + he so quy doi so voi don vi goc.
    @GetMapping("/{id}/conversions")
    public ApiResponse<List<UomConversion>> findConversions(@PathVariable Long id) {
        return ApiResponse.ok(uomGroupService.findConversions(id));
    }

    @PostMapping("/{id}/conversions")
    public ApiResponse<UomConversion> addConversion(@PathVariable Long id, @Valid @RequestBody UomConversionDto dto) {
        return ApiResponse.ok("Da them don vi vao nhom quy doi", uomGroupService.addConversion(id, dto));
    }

    @DeleteMapping("/{id}/conversions/{conversionId}")
    public ApiResponse<Void> removeConversion(@PathVariable Long id, @PathVariable Long conversionId) {
        uomGroupService.removeConversion(id, conversionId);
        return ApiResponse.ok("Da go don vi khoi nhom quy doi", null);
    }
}
