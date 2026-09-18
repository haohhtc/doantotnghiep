package com.erpqlkho.backend.sales.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.sales.dto.SalesRequestDto;
import com.erpqlkho.backend.sales.entity.SalesOrder;
import com.erpqlkho.backend.sales.entity.SalesRequest;
import com.erpqlkho.backend.sales.service.SalesRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sales-requests")
@RequiredArgsConstructor
public class SalesRequestController {

    private final SalesRequestService salesRequestService;

    @GetMapping
    public ApiResponse<List<SalesRequest>> findAll() {
        return ApiResponse.ok(salesRequestService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<SalesRequest> findById(@PathVariable Long id) {
        return ApiResponse.ok(salesRequestService.findById(id));
    }

    @PostMapping
    public ApiResponse<SalesRequest> create(@Valid @RequestBody SalesRequestDto dto) {
        return ApiResponse.ok("Tao yeu cau ban hang thanh cong", salesRequestService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<SalesRequest> update(@PathVariable Long id, @Valid @RequestBody SalesRequestDto dto) {
        return ApiResponse.ok("Cap nhat yeu cau ban hang thanh cong", salesRequestService.update(id, dto));
    }

    @PostMapping("/{id}/convert")
    public ApiResponse<SalesOrder> convert(@PathVariable Long id, @RequestParam Long warehouseId) {
        return ApiResponse.ok("Da chuyen thanh don hang ban", salesRequestService.convert(id, warehouseId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        salesRequestService.delete(id);
        return ApiResponse.ok("Da xoa yeu cau ban hang", null);
    }
}
