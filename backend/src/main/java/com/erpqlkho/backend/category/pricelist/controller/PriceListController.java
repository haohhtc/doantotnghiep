package com.erpqlkho.backend.category.pricelist.controller;

import com.erpqlkho.backend.category.pricelist.dto.PriceListDto;
import com.erpqlkho.backend.category.pricelist.dto.PriceListItemDto;
import com.erpqlkho.backend.category.pricelist.entity.PriceList;
import com.erpqlkho.backend.category.pricelist.entity.PriceListItem;
import com.erpqlkho.backend.category.pricelist.service.PriceListService;
import com.erpqlkho.backend.common.response.ApiResponse;
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

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/price-lists")
@RequiredArgsConstructor
public class PriceListController {

    private final PriceListService priceListService;

    @GetMapping
    public ApiResponse<List<PriceList>> findAll() {
        return ApiResponse.ok(priceListService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<PriceList> findById(@PathVariable Long id) {
        return ApiResponse.ok(priceListService.findById(id));
    }

    @PostMapping
    public ApiResponse<PriceList> create(@Valid @RequestBody PriceListDto dto) {
        return ApiResponse.ok("Tao bang gia thanh cong", priceListService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<PriceList> update(@PathVariable Long id, @Valid @RequestBody PriceListDto dto) {
        return ApiResponse.ok("Cap nhat bang gia thanh cong", priceListService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        priceListService.delete(id);
        return ApiResponse.ok("Da xoa bang gia", null);
    }

    // Dong gia trong bang gia: gan/go 1 san pham + don vi tinh + don gia.
    @GetMapping("/{id}/items")
    public ApiResponse<List<PriceListItem>> findItems(@PathVariable Long id) {
        return ApiResponse.ok(priceListService.findItems(id));
    }

    @PostMapping("/{id}/items")
    public ApiResponse<PriceListItem> addItem(@PathVariable Long id, @Valid @RequestBody PriceListItemDto dto) {
        return ApiResponse.ok("Da them gia san pham", priceListService.addItem(id, dto));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ApiResponse<Void> removeItem(@PathVariable Long id, @PathVariable Long itemId) {
        priceListService.removeItem(id, itemId);
        return ApiResponse.ok("Da xoa gia san pham", null);
    }

    // Tra gia tu dong cho 1 san pham theo Customer/Warehouse dang tao don hang - xem
    // PriceListService.lookupPrice de biet thu tu uu tien.
    @GetMapping("/lookup")
    public ApiResponse<BigDecimal> lookup(
            @RequestParam Long productId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long warehouseId) {
        return ApiResponse.ok(priceListService.lookupPrice(productId, customerId, warehouseId));
    }
}
