package com.erpqlkho.backend.inventory.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.inventory.dto.InventoryTransferDto;
import com.erpqlkho.backend.inventory.entity.InventoryTransfer;
import com.erpqlkho.backend.inventory.service.InventoryTransferService;
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
@RequestMapping("/api/inventory-transfers")
@RequiredArgsConstructor
public class InventoryTransferController {

    private final InventoryTransferService inventoryTransferService;

    @GetMapping
    public ApiResponse<List<InventoryTransfer>> findAll() {
        return ApiResponse.ok(inventoryTransferService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<InventoryTransfer> findById(@PathVariable Long id) {
        return ApiResponse.ok(inventoryTransferService.findById(id));
    }

    @PostMapping
    public ApiResponse<InventoryTransfer> create(@Valid @RequestBody InventoryTransferDto dto) {
        return ApiResponse.ok("Tao phieu dieu chuyen thanh cong", inventoryTransferService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<InventoryTransfer> update(@PathVariable Long id, @Valid @RequestBody InventoryTransferDto dto) {
        return ApiResponse.ok("Cap nhat phieu dieu chuyen thanh cong", inventoryTransferService.update(id, dto));
    }

    // Buoc 1: kho nguon xac nhan xuat hang - tru ton kho nguon.
    @PostMapping("/{id}/confirm-send")
    public ApiResponse<InventoryTransfer> confirmSend(@PathVariable Long id) {
        return ApiResponse.ok("Da xac nhan xuat kho nguon - dang van chuyen", inventoryTransferService.confirmSend(id));
    }

    // Buoc 2: kho dich xac nhan nhan hang - cong ton kho dich.
    @PostMapping("/{id}/confirm-receive")
    public ApiResponse<InventoryTransfer> confirmReceive(@PathVariable Long id) {
        return ApiResponse.ok("Da xac nhan nhan hang - da cong ton kho dich", inventoryTransferService.confirmReceive(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        inventoryTransferService.delete(id);
        return ApiResponse.ok("Da xoa phieu dieu chuyen", null);
    }
}
