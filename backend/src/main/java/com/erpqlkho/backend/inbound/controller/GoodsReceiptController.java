package com.erpqlkho.backend.inbound.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.common.response.PageResponse;
import com.erpqlkho.backend.inbound.dto.GoodsReceiptDto;
import com.erpqlkho.backend.inbound.entity.GoodsReceipt;
import com.erpqlkho.backend.inbound.service.GoodsReceiptService;
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
@RequestMapping("/api/goods-receipts")
@RequiredArgsConstructor
public class GoodsReceiptController {

    private final GoodsReceiptService goodsReceiptService;

    @GetMapping
    public ApiResponse<List<GoodsReceipt>> findAll() {
        return ApiResponse.ok(goodsReceiptService.findAll());
    }

    // Dung rieng cho luoi "Quan ly nhap hang" (phan trang + loc server-side).
    @GetMapping("/search")
    public ApiResponse<PageResponse<GoodsReceipt>> search(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = goodsReceiptService.search(branchId, search, PageRequest.of(page, size));
        return ApiResponse.ok(PageResponse.from(result));
    }

    @GetMapping("/{id}")
    public ApiResponse<GoodsReceipt> findById(@PathVariable Long id) {
        return ApiResponse.ok(goodsReceiptService.findById(id));
    }

    @PostMapping
    public ApiResponse<GoodsReceipt> create(@Valid @RequestBody GoodsReceiptDto dto) {
        return ApiResponse.ok("Tao phieu nhap thanh cong", goodsReceiptService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<GoodsReceipt> update(@PathVariable Long id, @Valid @RequestBody GoodsReceiptDto dto) {
        return ApiResponse.ok("Cap nhat phieu nhap thanh cong", goodsReceiptService.update(id, dto));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<GoodsReceipt> confirm(@PathVariable Long id) {
        return ApiResponse.ok("Da xac nhan phieu nhap - da cong ton kho", goodsReceiptService.confirm(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        goodsReceiptService.delete(id);
        return ApiResponse.ok("Da xoa phieu nhap", null);
    }
}
