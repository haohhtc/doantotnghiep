package com.erpqlkho.backend.inventory.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.inventory.dto.StockTakeDto;
import com.erpqlkho.backend.inventory.entity.StockTake;
import com.erpqlkho.backend.inventory.service.StockTakeService;
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
@RequestMapping("/api/stock-takes")
@RequiredArgsConstructor
public class StockTakeController {

    private final StockTakeService stockTakeService;

    @GetMapping
    public ApiResponse<List<StockTake>> findAll() {
        return ApiResponse.ok(stockTakeService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<StockTake> findById(@PathVariable Long id) {
        return ApiResponse.ok(stockTakeService.findById(id));
    }

    @PostMapping
    public ApiResponse<StockTake> create(@Valid @RequestBody StockTakeDto dto) {
        return ApiResponse.ok("Tao dot kiem ke thanh cong", stockTakeService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<StockTake> update(@PathVariable Long id, @Valid @RequestBody StockTakeDto dto) {
        return ApiResponse.ok("Cap nhat dot kiem ke thanh cong", stockTakeService.update(id, dto));
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<StockTake> approve(@PathVariable Long id) {
        return ApiResponse.ok("Da duyet dot kiem ke - da ghi nhan chenh lech", stockTakeService.approve(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        stockTakeService.delete(id);
        return ApiResponse.ok("Da xoa dot kiem ke", null);
    }
}
