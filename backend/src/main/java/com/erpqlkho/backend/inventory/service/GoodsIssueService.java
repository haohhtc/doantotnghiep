package com.erpqlkho.backend.inventory.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.dto.GoodsIssueDto;
import com.erpqlkho.backend.inventory.entity.GoodsIssue;
import com.erpqlkho.backend.inventory.entity.GoodsIssueItem;
import com.erpqlkho.backend.inventory.repository.GoodsIssueRepository;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

// Phieu xuat kho: tao/quan ly, xac nhan se tru ton kho that qua StockService (khong viet logic
// tru kho moi - tai dung y het pattern SalesOrderService dang lam).
@Service
@RequiredArgsConstructor
public class GoodsIssueService {

    private final GoodsIssueRepository goodsIssueRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockService stockService;

    public List<GoodsIssue> findAll() {
        return goodsIssueRepository.findAll();
    }

    public GoodsIssue findById(Long id) {
        return goodsIssueRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phieu xuat id=" + id));
    }

    @Transactional
    public GoodsIssue create(GoodsIssueDto dto) {
        GoodsIssue issue = new GoodsIssue();
        issue.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        issue.setStatus("DRAFT");
        issue.setCreatedBy(currentUser());
        applyDto(issue, dto);

        return goodsIssueRepository.save(issue);
    }

    @Transactional
    public GoodsIssue update(Long id, GoodsIssueDto dto) {
        GoodsIssue issue = findById(id);
        requireDraft(issue);
        applyDto(issue, dto);
        return goodsIssueRepository.save(issue);
    }

    @Transactional
    public void delete(Long id) {
        GoodsIssue issue = findById(id);
        requireDraft(issue);
        goodsIssueRepository.delete(issue);
    }

    // Xac nhan phieu xuat - tru ton kho + ghi stock_transaction cho tung dong (chan neu khong du ton).
    @Transactional
    public GoodsIssue confirm(Long id) {
        GoodsIssue issue = findById(id);
        requireDraft(issue);

        for (GoodsIssueItem item : issue.getItems()) {
            stockService.decrease(item.getProduct(), issue.getWarehouse(), item.getQuantity(),
                    "GOODS_ISSUE", issue.getId());
        }

        issue.setStatus("CLOSED");
        return goodsIssueRepository.save(issue);
    }

    private void applyDto(GoodsIssue issue, GoodsIssueDto dto) {
        issue.setDocDate(dto.getDocDate());
        issue.setPostingDate(dto.getPostingDate());
        issue.setWarehouse(findWarehouse(dto.getWarehouseId()));
        issue.setReason(dto.getReason());
        issue.setRemarks(dto.getRemarks());

        issue.getItems().clear();
        List<GoodsIssueItem> items = new ArrayList<>();
        for (GoodsIssueDto.ItemDto itemDto : dto.getItems()) {
            GoodsIssueItem item = new GoodsIssueItem();
            item.setGoodsIssue(issue);
            item.setProduct(findProduct(itemDto.getProductId()));
            item.setQuantity(itemDto.getQuantity());
            item.setBatch(itemDto.getBatch());
            item.setNote(itemDto.getNote());
            items.add(item);
        }
        issue.getItems().addAll(items);
    }

    private void requireDraft(GoodsIssue issue) {
        if (!"DRAFT".equals(issue.getStatus())) {
            throw ApiException.conflict("Phieu xuat da dong, khong the sua/xoa");
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (goodsIssueRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So phieu da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return "PX" + String.format("%04d", goodsIssueRepository.count() + 1);
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
