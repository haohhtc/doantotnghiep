package com.erpqlkho.backend.sales.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.common.response.PageResponse;
import com.erpqlkho.backend.sales.dto.SalesOrderDto;
import com.erpqlkho.backend.sales.entity.SalesOrder;
import com.erpqlkho.backend.sales.service.SalesOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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
@RequestMapping("/api/sales-orders")
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    // Khong doi - cac trang khac (Ton kho, Don giao hang) can toan bo danh sach de tu loc/tinh
    // toan, khong hien thi dang luoi lon cho nguoi dung nen chua can phan trang.
    @GetMapping
    public ApiResponse<List<SalesOrder>> findAll() {
        return ApiResponse.ok(salesOrderService.findAll());
    }

    // Dung rieng cho luoi "Quan ly ban hang" (phan trang + loc server-side) - xem
    // frontend/src/pages/sales/SalesOrder/index.jsx.
    @GetMapping("/search")
    public ApiResponse<PageResponse<SalesOrder>> search(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = salesOrderService.search(branchId, search, PageRequest.of(page, size));
        return ApiResponse.ok(PageResponse.from(result));
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
