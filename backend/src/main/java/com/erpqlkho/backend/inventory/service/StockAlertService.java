package com.erpqlkho.backend.inventory.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.dto.StockAlertDto;
import com.erpqlkho.backend.inventory.entity.Stock;
import com.erpqlkho.backend.inventory.entity.StockAlert;
import com.erpqlkho.backend.inventory.repository.StockAlertRepository;
import com.erpqlkho.backend.inventory.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

// INV-05: canh bao san pham sap het hang. Nguong (min_quantity) duoc cau hinh thu cong theo
// tung san pham+kho; trang thai ACTIVE/RESOLVED duoc tu dong cap nhat moi khi ton kho thay doi
// (xem StockService goi refreshStatus() sau moi lan increase/decrease/adjust).
@Service
@RequiredArgsConstructor
public class StockAlertService {

    private final StockAlertRepository stockAlertRepository;
    private final StockRepository stockRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    public List<StockAlert> findAll() {
        return stockAlertRepository.findAll();
    }

    public List<StockAlert> findActive() {
        return stockAlertRepository.findByStatus("ACTIVE");
    }

    @Transactional
    public StockAlert create(StockAlertDto dto) {
        if (stockAlertRepository.findByProductIdAndWarehouseId(dto.getProductId(), dto.getWarehouseId()).isPresent()) {
            throw ApiException.conflict("Da co nguong canh bao cho san pham + kho nay");
        }

        Product product = findProduct(dto.getProductId());
        Warehouse warehouse = findWarehouse(dto.getWarehouseId());

        StockAlert alert = new StockAlert();
        alert.setProduct(product);
        alert.setWarehouse(warehouse);
        alert.setMinQuantity(dto.getMinQuantity());
        alert.setStatus(computeStatus(currentQuantity(product.getId(), warehouse.getId()), dto.getMinQuantity()));

        return stockAlertRepository.save(alert);
    }

    @Transactional
    public StockAlert update(Long id, StockAlertDto dto) {
        StockAlert alert = findById(id);
        alert.setMinQuantity(dto.getMinQuantity());
        alert.setStatus(computeStatus(currentQuantity(alert.getProduct().getId(), alert.getWarehouse().getId()), dto.getMinQuantity()));
        return stockAlertRepository.save(alert);
    }

    // Nguoi dung tu tay danh dau da xu ly (VD: da dat mua them). Neu ton kho van con thap,
    // lan thay doi ton kho tiep theo se tu dong bat lai ACTIVE qua refreshStatus().
    @Transactional
    public StockAlert resolve(Long id) {
        StockAlert alert = findById(id);
        alert.setStatus("RESOLVED");
        return stockAlertRepository.save(alert);
    }

    // Goi tu StockService moi khi stock.quantity thay doi (IN/OUT/ADJUST).
    @Transactional
    public void refreshStatus(Product product, Warehouse warehouse, BigDecimal currentQuantity) {
        stockAlertRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .ifPresent(alert -> {
                    alert.setStatus(computeStatus(currentQuantity, alert.getMinQuantity()));
                    stockAlertRepository.save(alert);
                });
    }

    private String computeStatus(BigDecimal currentQuantity, BigDecimal minQuantity) {
        return currentQuantity.compareTo(minQuantity) <= 0 ? "ACTIVE" : "RESOLVED";
    }

    private BigDecimal currentQuantity(Long productId, Long warehouseId) {
        return stockRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .map(Stock::getQuantity)
                .orElse(BigDecimal.ZERO);
    }

    private StockAlert findById(Long id) {
        return stockAlertRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay canh bao id=" + id));
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay san pham id=" + id));
    }

    private Warehouse findWarehouse(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay kho id=" + id));
    }
}
