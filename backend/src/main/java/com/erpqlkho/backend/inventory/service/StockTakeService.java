package com.erpqlkho.backend.inventory.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.dto.StockTakeDto;
import com.erpqlkho.backend.inventory.entity.StockTake;
import com.erpqlkho.backend.inventory.entity.StockTakeDetail;
import com.erpqlkho.backend.inventory.repository.StockTakeRepository;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

// INV-04: tao/quan ly dot kiem ke, duyet se ghi nhan chenh lech vao stock_transaction (ADJUST).
@Service
@RequiredArgsConstructor
public class StockTakeService {

    private final StockTakeRepository stockTakeRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockService stockService;

    public List<StockTake> findAll() {
        return stockTakeRepository.findAll();
    }

    public StockTake findById(Long id) {
        return stockTakeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay dot kiem ke id=" + id));
    }

    @Transactional
    public StockTake create(StockTakeDto dto) {
        StockTake stockTake = new StockTake();
        stockTake.setCode(resolveCode(dto.getCode()));
        stockTake.setStatus("DRAFT");
        stockTake.setCreatedBy(currentUser());
        applyDto(stockTake, dto);

        return stockTakeRepository.save(stockTake);
    }

    @Transactional
    public StockTake update(Long id, StockTakeDto dto) {
        StockTake stockTake = findById(id);
        requireDraft(stockTake);
        applyDto(stockTake, dto);
        return stockTakeRepository.save(stockTake);
    }

    @Transactional
    public void delete(Long id) {
        StockTake stockTake = findById(id);
        requireDraft(stockTake);
        stockTakeRepository.delete(stockTake);
    }

    // INV-04: duyet dot kiem ke - ghi nhan chenh lech (ADJUST) cho tung dong co difference != 0.
    @Transactional
    public StockTake approve(Long id) {
        StockTake stockTake = findById(id);
        requireDraft(stockTake);

        for (StockTakeDetail detail : stockTake.getDetails()) {
            stockService.adjust(detail.getProduct(), stockTake.getWarehouse(), detail.getActualQuantity(),
                    "STOCK_TAKE", stockTake.getId());
        }

        stockTake.setStatus("APPROVED");
        return stockTakeRepository.save(stockTake);
    }

    private void applyDto(StockTake stockTake, StockTakeDto dto) {
        Warehouse warehouse = findWarehouse(dto.getWarehouseId());
        stockTake.setWarehouse(warehouse);

        stockTake.getDetails().clear();
        List<StockTakeDetail> details = new ArrayList<>();
        for (StockTakeDto.DetailDto detailDto : dto.getDetails()) {
            Product product = findProduct(detailDto.getProductId());
            BigDecimal systemQuantity = stockService.currentQuantity(product.getId(), warehouse.getId());

            StockTakeDetail detail = new StockTakeDetail();
            detail.setStockTake(stockTake);
            detail.setProduct(product);
            detail.setSystemQuantity(systemQuantity);
            detail.setActualQuantity(detailDto.getActualQuantity());
            detail.setDifference(detailDto.getActualQuantity().subtract(systemQuantity));
            details.add(detail);
        }
        stockTake.getDetails().addAll(details);
    }

    private void requireDraft(StockTake stockTake) {
        if (!"DRAFT".equals(stockTake.getStatus())) {
            throw ApiException.conflict("Dot kiem ke da duyet, khong the sua/xoa");
        }
    }

    private String resolveCode(String code) {
        if (code != null && !code.isBlank()) {
            if (stockTakeRepository.existsByCode(code)) {
                throw ApiException.conflict("Ma dot kiem ke da ton tai: " + code);
            }
            return code;
        }
        return "KK" + String.format("%04d", stockTakeRepository.count() + 1);
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
