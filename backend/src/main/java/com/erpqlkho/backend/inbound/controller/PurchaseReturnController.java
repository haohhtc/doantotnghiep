package com.erpqlkho.backend.inbound.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.inbound.dto.PurchaseReturnDto;
import com.erpqlkho.backend.inbound.entity.PurchaseReturn;
import com.erpqlkho.backend.inbound.service.PurchaseReturnService;
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
@RequestMapping("/api/purchase-returns")
@RequiredArgsConstructor
public class PurchaseReturnController {

    private final PurchaseReturnService purchaseReturnService;

    @GetMapping
    public ApiResponse<List<PurchaseReturn>> findAll() {
        return ApiResponse.ok(purchaseReturnService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<PurchaseReturn> findById(@PathVariable Long id) {
        return ApiResponse.ok(purchaseReturnService.findById(id));
    }

    @PostMapping
    public ApiResponse<PurchaseReturn> create(@Valid @RequestBody PurchaseReturnDto dto) {
        return ApiResponse.ok("Tao phieu tra hang NCC thanh cong", purchaseReturnService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<PurchaseReturn> update(@PathVariable Long id, @Valid @RequestBody PurchaseReturnDto dto) {
        return ApiResponse.ok("Cap nhat phieu tra hang NCC thanh cong", purchaseReturnService.update(id, dto));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<PurchaseReturn> confirm(@PathVariable Long id) {
        return ApiResponse.ok("Da duyet phieu tra hang NCC - da tru ton kho", purchaseReturnService.confirm(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        purchaseReturnService.delete(id);
        return ApiResponse.ok("Da xoa phieu tra hang NCC", null);
    }
}
