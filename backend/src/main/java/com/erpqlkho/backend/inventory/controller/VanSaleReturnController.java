package com.erpqlkho.backend.inventory.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.inventory.dto.VanSaleReturnDto;
import com.erpqlkho.backend.inventory.entity.VanSaleReturn;
import com.erpqlkho.backend.inventory.service.VanSaleReturnService;
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
@RequestMapping("/api/van-sale-returns")
@RequiredArgsConstructor
public class VanSaleReturnController {

    private final VanSaleReturnService vanSaleReturnService;

    @GetMapping
    public ApiResponse<List<VanSaleReturn>> findAll() {
        return ApiResponse.ok(vanSaleReturnService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<VanSaleReturn> findById(@PathVariable Long id) {
        return ApiResponse.ok(vanSaleReturnService.findById(id));
    }

    @PostMapping
    public ApiResponse<VanSaleReturn> create(@Valid @RequestBody VanSaleReturnDto dto) {
        return ApiResponse.ok("Tao phieu tra hang thanh cong", vanSaleReturnService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<VanSaleReturn> update(@PathVariable Long id, @Valid @RequestBody VanSaleReturnDto dto) {
        return ApiResponse.ok("Cap nhat thanh cong", vanSaleReturnService.update(id, dto));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<VanSaleReturn> confirm(@PathVariable Long id) {
        return ApiResponse.ok("Da duyet phieu tra hang", vanSaleReturnService.confirm(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        vanSaleReturnService.delete(id);
        return ApiResponse.ok("Da xoa phieu tra hang", null);
    }
}
