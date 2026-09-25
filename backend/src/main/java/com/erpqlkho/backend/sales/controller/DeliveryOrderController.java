package com.erpqlkho.backend.sales.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.sales.dto.DeliveryOrderDto;
import com.erpqlkho.backend.sales.entity.DeliveryOrder;
import com.erpqlkho.backend.sales.service.DeliveryOrderService;
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
@RequestMapping("/api/delivery-orders")
@RequiredArgsConstructor
public class DeliveryOrderController {

    private final DeliveryOrderService deliveryOrderService;

    @GetMapping
    public ApiResponse<List<DeliveryOrder>> findAll() {
        return ApiResponse.ok(deliveryOrderService.findAll());
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

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        deliveryOrderService.delete(id);
        return ApiResponse.ok("Da xoa don giao hang", null);
    }
}
