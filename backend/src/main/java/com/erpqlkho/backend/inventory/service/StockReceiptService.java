package com.erpqlkho.backend.inventory.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uomgroup.service.UomConversionService;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.dto.StockReceiptDto;
import com.erpqlkho.backend.inventory.entity.StockReceipt;
import com.erpqlkho.backend.inventory.entity.StockReceiptItem;
import com.erpqlkho.backend.inventory.repository.StockReceiptRepository;
import com.erpqlkho.backend.system.service.NumberingConfigService;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

// Phieu nhap kho: tao/quan ly, xac nhan se cong ton kho that qua StockService (tai dung pattern
// GoodsIssueService/GoodsReceiptService dang lam). Khac GoodsIssue: co DVT nen phai quy doi ve
// don vi co so truoc khi cong kho (giong SalesOrderService).
@Service
@RequiredArgsConstructor
public class StockReceiptService {

    private final StockReceiptRepository stockReceiptRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockService stockService;
    private final UomConversionService uomConversionService;
    private final NumberingConfigService numberingConfigService;

    public List<StockReceipt> findAll() {
        return stockReceiptRepository.findAll();
    }

    public StockReceipt findById(Long id) {
        return stockReceiptRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phieu nhap id=" + id));
    }

    @Transactional
    public StockReceipt create(StockReceiptDto dto) {
        StockReceipt receipt = new StockReceipt();
        receipt.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        receipt.setStatus("DRAFT");
        receipt.setCreatedBy(currentUser());
        applyDto(receipt, dto);

        return stockReceiptRepository.save(receipt);
    }

    @Transactional
    public StockReceipt update(Long id, StockReceiptDto dto) {
        StockReceipt receipt = findById(id);
        requireDraft(receipt);
        applyDto(receipt, dto);
        return stockReceiptRepository.save(receipt);
    }

    @Transactional
    public void delete(Long id) {
        StockReceipt receipt = findById(id);
        requireDraft(receipt);
        stockReceiptRepository.delete(receipt);
    }

    // Xac nhan phieu nhap - cong ton kho + ghi stock_transaction cho tung dong.
    @Transactional
    public StockReceipt confirm(Long id) {
        StockReceipt receipt = findById(id);
        requireDraft(receipt);

        for (StockReceiptItem item : receipt.getItems()) {
            stockService.increase(item.getProduct(), receipt.getWarehouse(), item.getBaseQuantity(),
                    "STOCK_RECEIPT", receipt.getId());
        }

        receipt.setStatus("CLOSED");
        return stockReceiptRepository.save(receipt);
    }

    private void applyDto(StockReceipt receipt, StockReceiptDto dto) {
        receipt.setDocDate(dto.getDocDate());
        receipt.setPostingDate(dto.getPostingDate());
        receipt.setWarehouse(findWarehouse(dto.getWarehouseId()));
        receipt.setReason(dto.getReason());
        receipt.setRemarks(dto.getRemarks());

        receipt.getItems().clear();
        List<StockReceiptItem> items = new ArrayList<>();
        for (StockReceiptDto.ItemDto itemDto : dto.getItems()) {
            Product product = findProduct(itemDto.getProductId());
            Uom uom = itemDto.getUomId() != null ? uomConversionService.findUom(itemDto.getUomId()) : null;

            StockReceiptItem item = new StockReceiptItem();
            item.setStockReceipt(receipt);
            item.setProduct(product);
            item.setQuantity(itemDto.getQuantity());
            item.setUom(uom);
            item.setBaseQuantity(uom != null
                    ? uomConversionService.toBase(product, uom, itemDto.getQuantity())
                    : itemDto.getQuantity());
            item.setUnitPrice(itemDto.getUnitPrice());
            item.setAmount(itemDto.getQuantity().multiply(itemDto.getUnitPrice()));
            items.add(item);
        }
        receipt.getItems().addAll(items);
    }

    private void requireDraft(StockReceipt receipt) {
        if (!"DRAFT".equals(receipt.getStatus())) {
            throw ApiException.conflict("Phieu nhap da dong, khong the sua/xoa");
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (stockReceiptRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So phieu da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return numberingConfigService.nextNumber("STOCK_RECEIPT");
    }

    private Warehouse findWarehouse(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay kho id=" + id));
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay san pham id=" + id));
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay user dang dang nhap"));
    }
}
