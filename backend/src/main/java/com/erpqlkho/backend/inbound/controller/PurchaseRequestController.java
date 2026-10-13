package com.erpqlkho.backend.inbound.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.inbound.dto.PurchaseRequestDto;
import com.erpqlkho.backend.inbound.entity.GoodsReceipt;
import com.erpqlkho.backend.inbound.entity.PurchaseRequest;
import com.erpqlkho.backend.inbound.service.PurchaseRequestService;
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
@RequestMapping("/api/purchase-requests")
@RequiredArgsConstructor
public class PurchaseRequestController {

    private final PurchaseRequestService purchaseRequestService;

    @GetMapping
    public ApiResponse<List<PurchaseRequest>> findAll() {
        return ApiResponse.ok(purchaseRequestService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<PurchaseRequest> findById(@PathVariable Long id) {
        return ApiResponse.ok(purchaseRequestService.findById(id));
    }

    @PostMapping
    public ApiResponse<PurchaseRequest> create(@Valid @RequestBody PurchaseRequestDto dto) {
        return ApiResponse.ok("Tao yeu cau mua hang thanh cong", purchaseRequestService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<PurchaseRequest> update(@PathVariable Long id, @Valid @RequestBody PurchaseRequestDto dto) {
        return ApiResponse.ok("Cap nhat thanh cong", purchaseRequestService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        purchaseRequestService.delete(id);
        return ApiResponse.ok("Da xoa yeu cau mua hang", null);
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<PurchaseRequest> submit(@PathVariable Long id) {
        return ApiResponse.ok("Da gui duyet yeu cau mua hang", purchaseRequestService.submit(id));
    }

    @PostMapping("/{id}/convert-to-goods-receipt")
    public ApiResponse<GoodsReceipt> convertToGoodsReceipt(@PathVariable Long id) {
        return ApiResponse.ok("Da tao phieu nhap hang tu yeu cau mua hang", purchaseRequestService.convertToGoodsReceipt(id));
    }
}
