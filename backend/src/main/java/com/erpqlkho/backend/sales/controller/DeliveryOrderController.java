package com.erpqlkho.backend.sales.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.common.response.PageResponse;
import com.erpqlkho.backend.sales.dto.DeliveryOrderDto;
import com.erpqlkho.backend.sales.entity.DeliveryOrder;
import com.erpqlkho.backend.sales.service.DeliveryOrderService;
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
@RequestMapping("/api/delivery-orders")
@RequiredArgsConstructor
public class DeliveryOrderController {

    private final DeliveryOrderService deliveryOrderService;

    // Khong doi - Don hang ban can toan bo de tinh "con lai chua giao" khi tao/sua Don giao hang
    // moi (xem frontend DeliveryOrder/index.jsx, loadComputationData - tai lazy khi mo modal).
    // salesOrderId (tuy chon): chi tra ve Don giao hang cua DUNG 1 don hang ban do - dung cho App
    // Van-Sale xem chi tiet 1 don (xem mobile preorder/[id].js). Bo trong -> tra ve toan bo nhu cu.
    @GetMapping
    public ApiResponse<List<DeliveryOrder>> findAll(@RequestParam(required = false) Long salesOrderId) {
        if (salesOrderId != null) {
            return ApiResponse.ok(deliveryOrderService.findBySalesOrderId(salesOrderId));
        }
        return ApiResponse.ok(deliveryOrderService.findAll());
    }

    // Dung cho trang Ton kho (nhe hon nhieu so voi tai toan bo Don giao hang) - xem
    // frontend/src/pages/inventory/Inventories/index.jsx.
    @GetMapping("/closed-van-mapping")
    public ApiResponse<List<com.erpqlkho.backend.sales.repository.DeliveryOrderRepository.ClosedVanMapping>> closedVanMapping() {
        return ApiResponse.ok(deliveryOrderService.findClosedVanMapping());
    }

    // Dung rieng cho luoi "Don giao hang" (phan trang + loc server-side).
    @GetMapping("/search")
    public ApiResponse<PageResponse<DeliveryOrder>> search(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = deliveryOrderService.search(branchId, search, PageRequest.of(page, size));
        return ApiResponse.ok(PageResponse.from(result));
    }

    @GetMapping("/{id}")
    public ApiResponse<DeliveryOrder> findById(@PathVariable Long id) {
        return ApiResponse.ok(deliveryOrderService.findById(id));
    }

    @PostMapping
    public ApiResponse<DeliveryOrder> create(@Valid @RequestBody DeliveryOrderDto dto) {
        return ApiResponse.ok("Tao don giao hang thanh cong", deliveryOrderService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<DeliveryOrder> update(@PathVariable Long id, @Valid @RequestBody DeliveryOrderDto dto) {
        return ApiResponse.ok("Cap nhat don giao hang thanh cong", deliveryOrderService.update(id, dto));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<DeliveryOrder> confirm(@PathVariable Long id) {
        return ApiResponse.ok("Da xac nhan giao hang - hang da chuyen sang Kho xe tai", deliveryOrderService.confirm(id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<DeliveryOrder> cancel(@PathVariable Long id) {
        return ApiResponse.ok("Da huy don giao hang - mo lai Don hang ban", deliveryOrderService.cancel(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        deliveryOrderService.delete(id);
        return ApiResponse.ok("Da xoa don giao hang", null);
    }
}
