package com.erpqlkho.backend.inbound.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.supplier.entity.Supplier;
import com.erpqlkho.backend.category.supplier.repository.SupplierRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inbound.dto.PurchaseRequestDto;
import com.erpqlkho.backend.inbound.entity.GoodsReceipt;
import com.erpqlkho.backend.inbound.entity.GoodsReceiptDetail;
import com.erpqlkho.backend.inbound.entity.PurchaseRequest;
import com.erpqlkho.backend.inbound.entity.PurchaseRequestItem;
import com.erpqlkho.backend.inbound.repository.GoodsReceiptRepository;
import com.erpqlkho.backend.inbound.repository.PurchaseRequestRepository;
import com.erpqlkho.backend.system.service.NumberingConfigService;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Yeu cau mua hang (Purchase Request): tao/quan ly khi con OPEN, Gui duyet (OPEN -> PENDING_APPROVAL,
// khoa sua), roi Tao phieu nhap hang (PENDING_APPROVAL -> CLOSED, tu sinh 1 Goods Receipt DRAFT moi -
// xem PurchaseRequest.java + V48). Chua dung gi den ton kho (chi Phieu nhap hang duoc Xac nhan rieng
// o trang Nhap hang moi cong kho).
@Service
@RequiredArgsConstructor
public class PurchaseRequestService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NumberingConfigService numberingConfigService;

    public List<PurchaseRequest> findAll() {
        return purchaseRequestRepository.findAll();
    }

    public PurchaseRequest findById(Long id) {
        return purchaseRequestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay yeu cau mua hang id=" + id));
    }

    @Transactional
    public PurchaseRequest create(PurchaseRequestDto dto) {
        PurchaseRequest request = new PurchaseRequest();
        request.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        request.setStatus("OPEN");
        request.setCreatedBy(currentUser());
        applyDto(request, dto);

        return purchaseRequestRepository.save(request);
    }

    @Transactional
    public PurchaseRequest update(Long id, PurchaseRequestDto dto) {
        PurchaseRequest request = findById(id);
        requireOpen(request);
        applyDto(request, dto);
        return purchaseRequestRepository.save(request);
    }

    @Transactional
    public void delete(Long id) {
        PurchaseRequest request = findById(id);
        requireOpen(request);
        purchaseRequestRepository.delete(request);
    }

    // Gui duyet - khoa sua, chuan bi cho buoc tao Phieu nhap hang.
    @Transactional
    public PurchaseRequest submit(Long id) {
        PurchaseRequest request = findById(id);
        requireOpen(request);
        request.setStatus("PENDING_APPROVAL");
        return purchaseRequestRepository.save(request);
    }

    // Tao Phieu nhap hang (Goods Receipt) that, trang thai DRAFT - copy NCC/Kho/san pham/so luong,
    // don gia "nen" gia sau chiet khau (Goods Receipt khong co cot chiet khau/thue rieng - xem
    // GoodsReceiptDetail.java). Yeu cau mua hang chuyen CLOSED, khong sua/xoa duoc nua.
    @Transactional
    public GoodsReceipt convertToGoodsReceipt(Long id) {
        PurchaseRequest request = findById(id);
        requirePendingApproval(request);

        GoodsReceipt receipt = new GoodsReceipt();
        receipt.setDocNumber(numberingConfigService.nextNumber("GOODS_RECEIPT"));
        receipt.setDocDate(LocalDate.now());
        receipt.setSupplier(request.getSupplier());
        receipt.setWarehouse(request.getWarehouse());
        receipt.setStatus("DRAFT");
        receipt.setCreatedBy(currentUser());
        receipt.setRemarks("Tu Yeu cau mua hang " + request.getDocNumber());

        List<GoodsReceiptDetail> details = new ArrayList<>();
        for (PurchaseRequestItem item : request.getItems()) {
            GoodsReceiptDetail detail = new GoodsReceiptDetail();
            detail.setGoodsReceipt(receipt);
            detail.setProduct(item.getProduct());
            detail.setQuantity(item.getQuantity());
            // Gia sau chiet khau, truoc thue (don vi/1 dong) - Goods Receipt khong tach rieng chiet khau.
            BigDecimal effectiveUnitPrice = item.getQuantity().signum() == 0
                    ? item.getUnitPrice()
                    : item.getLineSubtotal().divide(item.getQuantity(), 2, RoundingMode.HALF_UP);
            detail.setUnitPrice(effectiveUnitPrice);
            detail.setAmount(item.getLineSubtotal());
            details.add(detail);
        }
        receipt.getDetails().addAll(details);
        GoodsReceipt savedReceipt = goodsReceiptRepository.save(receipt);

        request.setGoodsReceipt(savedReceipt);
        request.setStatus("CLOSED");
        purchaseRequestRepository.save(request);

        return savedReceipt;
    }

    private void applyDto(PurchaseRequest request, PurchaseRequestDto dto) {
        request.setDocDate(dto.getDocDate());
        request.setRequestDate(dto.getRequestDate());
        request.setPostingDate(dto.getPostingDate());
        request.setSupplier(findSupplier(dto.getSupplierId()));
        request.setWarehouse(findWarehouse(dto.getWarehouseId()));
        request.setReason(dto.getReason());
        request.setRemarks(dto.getRemarks());

        request.getItems().clear();
        List<PurchaseRequestItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        for (PurchaseRequestDto.DetailDto detailDto : dto.getItems()) {
            Product product = findProduct(detailDto.getProductId());
            BigDecimal quantity = detailDto.getQuantity();
            BigDecimal unitPrice = detailDto.getUnitPrice();
            BigDecimal discountPercent = detailDto.getDiscountPercent() != null ? detailDto.getDiscountPercent() : BigDecimal.ZERO;

            BigDecimal gross = quantity.multiply(unitPrice);
            BigDecimal discountAmount = gross.multiply(discountPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineSubtotal = gross.subtract(discountAmount);
            BigDecimal taxRate = product.getPurchaseTaxGroup() != null
                    ? product.getPurchaseTaxGroup().getRatePercent()
                    : BigDecimal.ZERO;
            BigDecimal taxAmount = lineSubtotal.multiply(taxRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineSubtotal.add(taxAmount);

            PurchaseRequestItem item = new PurchaseRequestItem();
            item.setPurchaseRequest(request);
            item.setProduct(product);
            item.setQuantity(quantity);
            item.setUnitPrice(unitPrice);
            item.setDiscountPercent(discountPercent);
            item.setDiscountAmount(discountAmount);
            item.setLineSubtotal(lineSubtotal);
            item.setTaxRate(taxRate);
            item.setTaxAmount(taxAmount);
            item.setLineTotal(lineTotal);
            item.setNote(detailDto.getNote());
            items.add(item);

            subtotal = subtotal.add(lineSubtotal);
            totalTax = totalTax.add(taxAmount);
        }
        request.getItems().addAll(items);
        request.setSubtotalAmount(subtotal);
        request.setTaxAmount(totalTax);
        request.setTotalAmount(subtotal.add(totalTax));
    }

    private void requireOpen(PurchaseRequest request) {
        if (!"OPEN".equals(request.getStatus())) {
            throw ApiException.conflict("Yeu cau mua hang khong con o trang thai Mo, khong the sua/xoa/gui duyet");
        }
    }

    private void requirePendingApproval(PurchaseRequest request) {
        if (!"PENDING_APPROVAL".equals(request.getStatus())) {
            throw ApiException.conflict("Yeu cau mua hang phai o trang thai Cho duyet moi tao duoc Phieu nhap hang");
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (purchaseRequestRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So phieu da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return numberingConfigService.nextNumber("PURCHASE_REQUEST");
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
