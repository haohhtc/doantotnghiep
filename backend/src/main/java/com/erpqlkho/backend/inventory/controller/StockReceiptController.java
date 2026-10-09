package com.erpqlkho.backend.inventory.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.inventory.dto.StockReceiptDto;
import com.erpqlkho.backend.inventory.entity.StockReceipt;
import com.erpqlkho.backend.inventory.service.StockReceiptService;
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
@RequestMapping("/api/stock-receipts")
@RequiredArgsConstructor
public class StockReceiptController {

    private final StockReceiptService stockReceiptService;

    @GetMapping
    public ApiResponse<List<StockReceipt>> findAll() {
        return ApiResponse.ok(stockReceiptService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<StockReceipt> findById(@PathVariable Long id) {
        return ApiResponse.ok(stockReceiptService.findById(id));
    }

    @PostMapping
    public ApiResponse<StockReceipt> create(@Valid @RequestBody StockReceiptDto dto) {
        return ApiResponse.ok("Tao phieu nhap thanh cong", stockReceiptService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<StockReceipt> update(@PathVariable Long id, @Valid @RequestBody StockReceiptDto dto) {
        return ApiResponse.ok("Cap nhat phieu nhap thanh cong", stockReceiptService.update(id, dto));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<StockReceipt> confirm(@PathVariable Long id) {
        return ApiResponse.ok("Da xac nhan phieu nhap - da cong ton kho", stockReceiptService.confirm(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        stockReceiptService.delete(id);
        return ApiResponse.ok("Da xoa phieu nhap", null);
    }
}
