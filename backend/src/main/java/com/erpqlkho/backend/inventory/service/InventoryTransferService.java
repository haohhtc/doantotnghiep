package com.erpqlkho.backend.inventory.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.dto.InventoryTransferDto;
import com.erpqlkho.backend.inventory.entity.InventoryTransfer;
import com.erpqlkho.backend.inventory.entity.InventoryTransferItem;
import com.erpqlkho.backend.inventory.repository.InventoryTransferRepository;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Dieu chuyen kho: tao/quan ly, roi 2 buoc xac nhan doc lap (kho nguon xac nhan xuat, kho dich
// xac nhan nhan) - giong DMS that, tranh hang "boc hoi" giua duong. Moi buoc tai dung StockService
// co san (decrease/increase), khong viet logic tru/cong kho moi.
@Service
@RequiredArgsConstructor
public class InventoryTransferService {

    private final InventoryTransferRepository inventoryTransferRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockService stockService;

    public List<InventoryTransfer> findAll() {
        return inventoryTransferRepository.findAll();
    }

    public InventoryTransfer findById(Long id) {
        return inventoryTransferRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phieu dieu chuyen id=" + id));
    }

    @Transactional
    public InventoryTransfer create(InventoryTransferDto dto) {
        InventoryTransfer transfer = new InventoryTransfer();
        transfer.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        transfer.setStatus("DRAFT");
        transfer.setCreatedBy(currentUser());
        applyDto(transfer, dto);

        return inventoryTransferRepository.save(transfer);
    }

    @Transactional
    public InventoryTransfer update(Long id, InventoryTransferDto dto) {
        InventoryTransfer transfer = findById(id);
        requireStatus(transfer, "DRAFT", "sua");
        applyDto(transfer, dto);
        return inventoryTransferRepository.save(transfer);
    }

    @Transactional
    public void delete(Long id) {
        InventoryTransfer transfer = findById(id);
        requireStatus(transfer, "DRAFT", "xoa");
        inventoryTransferRepository.delete(transfer);
    }

    // Buoc 1 - Kho nguon xac nhan xuat: tru ton kho nguon, chuyen DRAFT -> IN_TRANSIT.
    @Transactional
    public InventoryTransfer confirmSend(Long id) {
        InventoryTransfer transfer = findById(id);
        requireStatus(transfer, "DRAFT", "xac nhan xuat");

        for (InventoryTransferItem item : transfer.getItems()) {
            stockService.decrease(item.getProduct(), transfer.getFromWarehouse(), item.getQuantity(),
                    "INVENTORY_TRANSFER", transfer.getId());
        }

        transfer.setStatus("IN_TRANSIT");
        transfer.setSentAt(LocalDateTime.now());
        return inventoryTransferRepository.save(transfer);
    }

    // Buoc 2 - Kho dich xac nhan nhan: cong ton kho dich, chuyen IN_TRANSIT -> CLOSED.
    @Transactional
    public InventoryTransfer confirmReceive(Long id) {
        InventoryTransfer transfer = findById(id);
        requireStatus(transfer, "IN_TRANSIT", "xac nhan nhan");

        for (InventoryTransferItem item : transfer.getItems()) {
            stockService.increase(item.getProduct(), transfer.getToWarehouse(), item.getQuantity(),
                    "INVENTORY_TRANSFER", transfer.getId());
        }

        transfer.setStatus("CLOSED");
        transfer.setReceivedAt(LocalDateTime.now());
        return inventoryTransferRepository.save(transfer);
    }

    private void applyDto(InventoryTransfer transfer, InventoryTransferDto dto) {
        if (dto.getFromWarehouseId().equals(dto.getToWarehouseId())) {
            throw ApiException.conflict("Kho di va kho den khong duoc trung nhau");
        }

        transfer.setDocDate(dto.getDocDate());
        transfer.setPostingDate(dto.getPostingDate());
        transfer.setFromWarehouse(findWarehouse(dto.getFromWarehouseId()));
        transfer.setToWarehouse(findWarehouse(dto.getToWarehouseId()));
        transfer.setSalesEmployee(dto.getSalesEmployeeId() != null ? findUser(dto.getSalesEmployeeId()) : null);
        transfer.setReason(dto.getReason());
        transfer.setRemarks(dto.getRemarks());

        transfer.getItems().clear();
        List<InventoryTransferItem> items = new ArrayList<>();
        for (InventoryTransferDto.ItemDto itemDto : dto.getItems()) {
            InventoryTransferItem item = new InventoryTransferItem();
            item.setInventoryTransfer(transfer);
            item.setProduct(findProduct(itemDto.getProductId()));
            item.setQuantity(itemDto.getQuantity());
            item.setBatch(itemDto.getBatch());
            item.setNote(itemDto.getNote());
            items.add(item);
        }
        transfer.getItems().addAll(items);
    }

    private void requireStatus(InventoryTransfer transfer, String required, String action) {
        if (!required.equals(transfer.getStatus())) {
            throw ApiException.conflict("Khong the " + action + ": phieu dang o trang thai " + transfer.getStatus());
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (inventoryTransferRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So phieu da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return "DC" + String.format("%04d", inventoryTransferRepository.count() + 1);
    }

    private Warehouse findWarehouse(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay kho id=" + id));
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay san pham id=" + id));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nhan vien id=" + id));
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay user dang dang nhap"));
    }
}
