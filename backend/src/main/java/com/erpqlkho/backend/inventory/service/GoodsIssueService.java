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
import com.erpqlkho.backend.printing.repository.PrintedNoteRepository;
import com.erpqlkho.backend.printing.repository.PrintedNoteSummary;
import com.erpqlkho.backend.system.service.NumberingConfigService;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
    private final NumberingConfigService numberingConfigService;
    private final PrintedNoteRepository printedNoteRepository;

    public List<GoodsIssue> findAll() {
        return goodsIssueRepository.findAll();
    }

    // Man hinh "Phieu in nhanh" - xem GoodsIssueRepository.searchForPrint.
    public org.springframework.data.domain.Page<GoodsIssue> searchForPrint(
            Long branchId, LocalDate fromDate, LocalDate toDate, String reason, String printStatus,
            org.springframework.data.domain.Pageable pageable) {
        LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toDateTime = toDate != null ? toDate.atTime(23, 59, 59) : null;
        var page = goodsIssueRepository.searchForPrint(
                branchId, fromDate, toDate, fromDateTime, toDateTime, reason, printStatus, pageable);
        applyPrintSummary(page.getContent());
        return page;
    }

    private void applyPrintSummary(List<GoodsIssue> issues) {
        if (issues.isEmpty()) return;
        List<String> docNumbers = issues.stream().map(GoodsIssue::getDocNumber).toList();
        Map<String, PrintedNoteSummary> byDocNumber = printedNoteRepository.summarize("STOCK_ISSUE", docNumbers)
                .stream().collect(java.util.stream.Collectors.toMap(PrintedNoteSummary::getDocNumber, s -> s));
        for (GoodsIssue issue : issues) {
            PrintedNoteSummary summary = byDocNumber.get(issue.getDocNumber());
            issue.setPrintCount(summary != null ? summary.getPrintCount().intValue() : 0);
            issue.setLastPrintedAt(summary != null ? summary.getLastPrintedAt() : null);
        }
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
        return numberingConfigService.nextNumber("GOODS_ISSUE");
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
