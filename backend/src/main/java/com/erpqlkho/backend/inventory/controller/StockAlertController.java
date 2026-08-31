package com.erpqlkho.backend.inventory.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.inventory.dto.StockAlertDto;
import com.erpqlkho.backend.inventory.entity.StockAlert;
import com.erpqlkho.backend.inventory.service.StockAlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// INV-05: canh bao san pham sap het hang.
@RestController
@RequestMapping("/api/stock-alerts")
@RequiredArgsConstructor
public class StockAlertController {

    private final StockAlertService stockAlertService;

    @GetMapping
    public ApiResponse<List<StockAlert>> findAll(@RequestParam(required = false) String status) {
        if ("ACTIVE".equalsIgnoreCase(status)) {
            return ApiResponse.ok(stockAlertService.findActive());
        }
        return ApiResponse.ok(stockAlertService.findAll());
    }

    @PostMapping
    public ApiResponse<StockAlert> create(@Valid @RequestBody StockAlertDto dto) {
        return ApiResponse.ok("Tao nguong canh bao thanh cong", stockAlertService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<StockAlert> update(@PathVariable Long id, @Valid @RequestBody StockAlertDto dto) {
        return ApiResponse.ok("Cap nhat nguong canh bao thanh cong", stockAlertService.update(id, dto));
    }

    @PutMapping("/{id}/resolve")
    public ApiResponse<StockAlert> resolve(@PathVariable Long id) {
        return ApiResponse.ok("Da danh dau xu ly canh bao", stockAlertService.resolve(id));
    }
}
