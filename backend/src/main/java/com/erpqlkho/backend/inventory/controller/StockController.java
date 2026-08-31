package com.erpqlkho.backend.inventory.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.inventory.entity.Stock;
import com.erpqlkho.backend.inventory.entity.StockTransaction;
import com.erpqlkho.backend.inventory.repository.StockTransactionRepository;
import com.erpqlkho.backend.inventory.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// INV-01/03: theo doi ton kho hien tai theo san pham x kho.
// INV-02: lich su nhap/xuat (doc thang tu stock_transaction, day la log bat bien - khong co CRUD).
@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;
    private final StockTransactionRepository stockTransactionRepository;

    @GetMapping
    public ApiResponse<List<Stock>> findAll() {
        return ApiResponse.ok(stockService.findAll());
    }

    @GetMapping("/transactions")
    public ApiResponse<List<StockTransaction>> findAllTransactions() {
        return ApiResponse.ok(stockTransactionRepository.findAll());
    }
}
