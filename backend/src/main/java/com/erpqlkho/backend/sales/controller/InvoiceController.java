package com.erpqlkho.backend.sales.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.sales.dto.InvoiceDto;
import com.erpqlkho.backend.sales.entity.Invoice;
import com.erpqlkho.backend.sales.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ApiResponse<List<Invoice>> findAll() {
        return ApiResponse.ok(invoiceService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Invoice> findById(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.findById(id));
    }

    // Xuat hoa don tu 1 dot giao hang cu the (V49) - chon tung dong/so luong muon xuat.
    @PostMapping
    public ApiResponse<Invoice> create(@Valid @RequestBody InvoiceDto dto) {
        return ApiResponse.ok("Xuat hoa don thanh cong", invoiceService.create(dto));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<Invoice> cancel(@PathVariable Long id) {
        return ApiResponse.ok("Da huy hoa don - mo lai Don giao hang", invoiceService.cancel(id));
    }
}
