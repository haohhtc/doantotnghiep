package com.erpqlkho.backend.sales.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.sales.dto.SalesOrderDto;
import com.erpqlkho.backend.sales.entity.SalesOrder;
import com.erpqlkho.backend.sales.service.SalesOrderService;
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
@RequestMapping("/api/sales-orders")
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @GetMapping
    public ApiResponse<List<SalesOrder>> findAll() {
        return ApiResponse.ok(salesOrderService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<SalesOrder> findById(@PathVariable Long id) {
        return ApiResponse.ok(salesOrderService.findById(id));
    }

    @PostMapping
    public ApiResponse<SalesOrder> create(@Valid @RequestBody SalesOrderDto dto) {
        return ApiResponse.ok("Tao don hang thanh cong", salesOrderService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<SalesOrder> update(@PathVariable Long id, @Valid @RequestBody SalesOrderDto dto) {
        return ApiResponse.ok("Cap nhat don hang thanh cong", salesOrderService.update(id, dto));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<SalesOrder> confirm(@PathVariable Long id) {
        return ApiResponse.ok("Da xac nhan don hang - da xuat kho", salesOrderService.confirm(id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<SalesOrder> cancel(@PathVariable Long id) {
        return ApiResponse.ok("Da huy don hang", salesOrderService.cancel(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        salesOrderService.delete(id);
        return ApiResponse.ok("Da xoa don hang", null);
    }
}
