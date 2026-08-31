package com.erpqlkho.backend.inbound.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.supplier.entity.Supplier;
import com.erpqlkho.backend.category.supplier.repository.SupplierRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inbound.dto.GoodsReceiptDto;
import com.erpqlkho.backend.inbound.entity.GoodsReceipt;
import com.erpqlkho.backend.inbound.entity.GoodsReceiptDetail;
import com.erpqlkho.backend.inbound.repository.GoodsReceiptRepository;
import com.erpqlkho.backend.inventory.service.StockService;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

// IN-01..04: tao/quan ly phieu nhap hang, xac nhan se cong ton kho (IN-03).
@Service
@RequiredArgsConstructor
public class GoodsReceiptService {

    private final GoodsReceiptRepository goodsReceiptRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockService stockService;

    public List<GoodsReceipt> findAll() {
        return goodsReceiptRepository.findAll();
    }

    public GoodsReceipt findById(Long id) {
        return goodsReceiptRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phieu nhap id=" + id));
    }

    @Transactional
    public GoodsReceipt create(GoodsReceiptDto dto) {
        GoodsReceipt receipt = new GoodsReceipt();
        receipt.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        receipt.setStatus("DRAFT");
        receipt.setCreatedBy(currentUser());
        applyDto(receipt, dto);

        return goodsReceiptRepository.save(receipt);
    }

    @Transactional
    public GoodsReceipt update(Long id, GoodsReceiptDto dto) {
        GoodsReceipt receipt = findById(id);
        requireDraft(receipt);
        applyDto(receipt, dto);
        return goodsReceiptRepository.save(receipt);
    }

    @Transactional
    public void delete(Long id) {
        GoodsReceipt receipt = findById(id);
        requireDraft(receipt);
        goodsReceiptRepository.delete(receipt);
    }

    // IN-03: xac nhan phieu nhap - cong ton kho + ghi stock_transaction cho tung dong.
    @Transactional
    public GoodsReceipt confirm(Long id) {
        GoodsReceipt receipt = findById(id);
        requireDraft(receipt);

        for (GoodsReceiptDetail detail : receipt.getDetails()) {
            stockService.increase(detail.getProduct(), receipt.getWarehouse(), detail.getQuantity(),
                    "GOODS_RECEIPT", receipt.getId());
        }

        receipt.setStatus("CLOSED");
        return goodsReceiptRepository.save(receipt);
    }

    private void applyDto(GoodsReceipt receipt, GoodsReceiptDto dto) {
        receipt.setDocDate(dto.getDocDate());
        receipt.setPostingDate(dto.getPostingDate());
        receipt.setSupplier(findSupplier(dto.getSupplierId()));
        receipt.setWarehouse(findWarehouse(dto.getWarehouseId()));
        receipt.setRemarks(dto.getRemarks());

        receipt.getDetails().clear();
        List<GoodsReceiptDetail> details = new ArrayList<>();
        for (GoodsReceiptDto.DetailDto detailDto : dto.getDetails()) {
            GoodsReceiptDetail detail = new GoodsReceiptDetail();
            detail.setGoodsReceipt(receipt);
            detail.setProduct(findProduct(detailDto.getProductId()));
            detail.setQuantity(detailDto.getQuantity());
            detail.setUnitPrice(detailDto.getUnitPrice());
            detail.setAmount(detailDto.getQuantity().multiply(detailDto.getUnitPrice()));
            details.add(detail);
        }
        receipt.getDetails().addAll(details);
    }

    private void requireDraft(GoodsReceipt receipt) {
        if (!"DRAFT".equals(receipt.getStatus())) {
            throw ApiException.conflict("Phieu nhap da dong, khong the sua/xoa");
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (goodsReceiptRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So phieu da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return "PN" + String.format("%04d", goodsReceiptRepository.count() + 1);
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

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay user dang dang nhap"));
    }
}
