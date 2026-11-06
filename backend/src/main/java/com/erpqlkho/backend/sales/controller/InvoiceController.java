package com.erpqlkho.backend.sales.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.common.response.PageResponse;
import com.erpqlkho.backend.sales.dto.InvoiceDto;
import com.erpqlkho.backend.sales.dto.VanSaleInvoiceDto;
import com.erpqlkho.backend.sales.entity.Invoice;
import com.erpqlkho.backend.sales.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    // deliveryOrderIds (tuy chon): chi tra ve hoa don cua CAC don giao hang do - dung cho luoi
    // "Don giao hang" (phan trang) tinh "con lai chua xuat hoa don" cho trang dang xem, khong can
    // tai het 4000+ hoa don (xem frontend DeliveryOrder/index.jsx).
    // salesOrderId (tuy chon): chi tra ve hoa don cua DUNG 1 don hang ban do - dung cho App
    // Van-Sale xem chi tiet 1 don (xem mobile preorder/vansale [id].js, invoice.js).
    // Bo ca 2 -> tra ve toan bo nhu cu.
    @GetMapping
    public ApiResponse<List<Invoice>> findAll(@RequestParam(required = false) List<Long> deliveryOrderIds,
                                               @RequestParam(required = false) Long salesOrderId) {
        if (deliveryOrderIds != null && !deliveryOrderIds.isEmpty()) {
            return ApiResponse.ok(invoiceService.findByDeliveryOrderIds(deliveryOrderIds));
        }
        if (salesOrderId != null) {
            return ApiResponse.ok(invoiceService.findBySalesOrderId(salesOrderId));
        }
        return ApiResponse.ok(invoiceService.findAll());
    }

    // Dung cho trang Ton kho (nhe hon nhieu so voi tai toan bo Hoa don) - xem
    // frontend/src/pages/inventory/Inventories/index.jsx.
    @GetMapping("/active-sales-order-ids")
    public ApiResponse<List<Long>> activeSalesOrderIds() {
        return ApiResponse.ok(invoiceService.findActiveSalesOrderIds());
    }

    // Dung rieng cho luoi "Hoa don" (phan trang + loc server-side).
    @GetMapping("/search")
    public ApiResponse<PageResponse<Invoice>> search(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = invoiceService.search(branchId, search, PageRequest.of(page, size));
        return ApiResponse.ok(PageResponse.from(result));
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

    // App Van-Sale (di dong): xuat hoa don THANG cho Van Sale, khong qua Don giao hang.
    @PostMapping("/van-sale")
    public ApiResponse<Invoice> createVanSale(@Valid @RequestBody VanSaleInvoiceDto dto) {
        return ApiResponse.ok("Xuat hoa don Van Sale thanh cong", invoiceService.createVanSale(dto));
    }
}
