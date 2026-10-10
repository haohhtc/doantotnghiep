package com.erpqlkho.backend.sales.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.sales.dto.SalesReturnDto;
import com.erpqlkho.backend.sales.entity.SalesReturn;
import com.erpqlkho.backend.sales.service.SalesReturnService;
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
@RequestMapping("/api/sales-returns")
@RequiredArgsConstructor
public class SalesReturnController {

    private final SalesReturnService salesReturnService;

    @GetMapping
    public ApiResponse<List<SalesReturn>> findAll() {
        return ApiResponse.ok(salesReturnService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<SalesReturn> findById(@PathVariable Long id) {
        return ApiResponse.ok(salesReturnService.findById(id));
    }

    @PostMapping
    public ApiResponse<SalesReturn> create(@Valid @RequestBody SalesReturnDto dto) {
        return ApiResponse.ok("Tao phieu tra hang thanh cong", salesReturnService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<SalesReturn> update(@PathVariable Long id, @Valid @RequestBody SalesReturnDto dto) {
        return ApiResponse.ok("Cap nhat phieu tra hang thanh cong", salesReturnService.update(id, dto));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<SalesReturn> confirm(@PathVariable Long id) {
        return ApiResponse.ok("Da duyet phieu tra hang - da cong ton kho", salesReturnService.confirm(id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<SalesReturn> cancel(@PathVariable Long id) {
        return ApiResponse.ok("Da huy phieu tra hang", salesReturnService.cancel(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        salesReturnService.delete(id);
        return ApiResponse.ok("Da xoa phieu tra hang", null);
    }
}
