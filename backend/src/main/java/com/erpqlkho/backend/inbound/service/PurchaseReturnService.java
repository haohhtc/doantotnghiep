package com.erpqlkho.backend.inbound.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.supplier.entity.Supplier;
import com.erpqlkho.backend.category.supplier.repository.SupplierRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inbound.dto.PurchaseReturnDto;
import com.erpqlkho.backend.inbound.entity.GoodsReceipt;
import com.erpqlkho.backend.inbound.entity.PurchaseReturn;
import com.erpqlkho.backend.inbound.entity.PurchaseReturnItem;
import com.erpqlkho.backend.inbound.repository.GoodsReceiptRepository;
import com.erpqlkho.backend.inbound.repository.PurchaseReturnRepository;
import com.erpqlkho.backend.inventory.service.StockService;
import com.erpqlkho.backend.system.service.NumberingConfigService;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

// Phieu tra hang NCC: tao/quan ly, duyet se tru ton kho that qua StockService (tai dung y het
// pattern GoodsIssueService).
@Service
@RequiredArgsConstructor
public class PurchaseReturnService {

    private final PurchaseReturnRepository purchaseReturnRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final UserRepository userRepository;
    private final StockService stockService;
    private final NumberingConfigService numberingConfigService;

    public List<PurchaseReturn> findAll() {
        return purchaseReturnRepository.findAll();
    }

    public PurchaseReturn findById(Long id) {
        return purchaseReturnRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phieu tra hang id=" + id));
    }

    @Transactional
    public PurchaseReturn create(PurchaseReturnDto dto) {
        PurchaseReturn ret = new PurchaseReturn();
        ret.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        ret.setStatus("DRAFT");
        ret.setCreatedBy(currentUser());
        applyDto(ret, dto);

        return purchaseReturnRepository.save(ret);
    }

    @Transactional
    public PurchaseReturn update(Long id, PurchaseReturnDto dto) {
        PurchaseReturn ret = findById(id);
        requireDraft(ret);
        applyDto(ret, dto);
        return purchaseReturnRepository.save(ret);
    }

    @Transactional
    public void delete(Long id) {
        PurchaseReturn ret = findById(id);
        requireDraft(ret);
        purchaseReturnRepository.delete(ret);
    }

    // Duyet phieu tra hang NCC - tru ton kho + ghi stock_transaction cho tung dong.
    @Transactional
    public PurchaseReturn confirm(Long id) {
        PurchaseReturn ret = findById(id);
        requireDraft(ret);

        for (PurchaseReturnItem item : ret.getItems()) {
            stockService.decrease(item.getProduct(), ret.getWarehouse(), item.getQuantity(),
                    "PURCHASE_RETURN", ret.getId());
        }

        ret.setStatus("CLOSED");
        return purchaseReturnRepository.save(ret);
    }

    private void applyDto(PurchaseReturn ret, PurchaseReturnDto dto) {
        ret.setDocDate(dto.getDocDate());
        ret.setPostingDate(dto.getPostingDate());
        ret.setSupplier(findSupplier(dto.getSupplierId()));
        ret.setWarehouse(findWarehouse(dto.getWarehouseId()));
        ret.setGoodsReceipt(findGoodsReceipt(dto.getGoodsReceiptId()));
        ret.setReason(dto.getReason());
        ret.setRemarks(dto.getRemarks());

        ret.getItems().clear();
        List<PurchaseReturnItem> items = new ArrayList<>();
        for (PurchaseReturnDto.ItemDto itemDto : dto.getItems()) {
            PurchaseReturnItem item = new PurchaseReturnItem();
            item.setPurchaseReturn(ret);
            item.setProduct(findProduct(itemDto.getProductId()));
            item.setQuantity(itemDto.getQuantity());
            item.setNote(itemDto.getNote());
            items.add(item);
        }
        ret.getItems().addAll(items);
    }

    private void requireDraft(PurchaseReturn ret) {
        if (!"DRAFT".equals(ret.getStatus())) {
            throw ApiException.conflict("Phieu tra hang da duyet, khong the sua/xoa");
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (purchaseReturnRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So phieu da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return numberingConfigService.nextNumber("PURCHASE_RETURN");
    }

    private Supplier findSupplier(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nha cung cap id=" + id));
    }

    private Warehouse findWarehouse(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay kho id=" + id));
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay san pham id=" + id));
    }

    private GoodsReceipt findGoodsReceipt(Long id) {
        if (id == null) return null;
        return goodsReceiptRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phieu nhap id=" + id));
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay user dang dang nhap"));
    }
}
