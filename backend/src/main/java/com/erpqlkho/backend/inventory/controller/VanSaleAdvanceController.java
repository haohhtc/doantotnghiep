package com.erpqlkho.backend.inventory.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.inventory.dto.VanSaleAdvanceDto;
import com.erpqlkho.backend.inventory.entity.VanSaleAdvance;
import com.erpqlkho.backend.inventory.service.VanSaleAdvanceService;
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
@RequestMapping("/api/van-sale-advances")
@RequiredArgsConstructor
public class VanSaleAdvanceController {

    private final VanSaleAdvanceService vanSaleAdvanceService;

    @GetMapping
    public ApiResponse<List<VanSaleAdvance>> findAll() {
        return ApiResponse.ok(vanSaleAdvanceService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<VanSaleAdvance> findById(@PathVariable Long id) {
        return ApiResponse.ok(vanSaleAdvanceService.findById(id));
    }

    @PostMapping
    public ApiResponse<VanSaleAdvance> create(@Valid @RequestBody VanSaleAdvanceDto dto) {
        return ApiResponse.ok("Tao phieu ung hang thanh cong", vanSaleAdvanceService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<VanSaleAdvance> update(@PathVariable Long id, @Valid @RequestBody VanSaleAdvanceDto dto) {
        return ApiResponse.ok("Cap nhat thanh cong", vanSaleAdvanceService.update(id, dto));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<VanSaleAdvance> confirm(@PathVariable Long id) {
        return ApiResponse.ok("Da duyet phieu ung hang", vanSaleAdvanceService.confirm(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        vanSaleAdvanceService.delete(id);
        return ApiResponse.ok("Da xoa phieu ung hang", null);
    }
}
