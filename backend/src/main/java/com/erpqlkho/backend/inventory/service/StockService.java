package com.erpqlkho.backend.inventory.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.entity.Stock;
import com.erpqlkho.backend.inventory.entity.StockTransaction;
import com.erpqlkho.backend.inventory.repository.StockRepository;
import com.erpqlkho.backend.inventory.repository.StockTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Noi duy nhat duoc phep sua bang `stock` va ghi `stock_transaction` - bat bien:
 * stock.quantity luon phai bang tong cac stock_transaction lien quan (xem V5__inventory.sql).
 * GoodsReceiptService (IN), SalesOrderService (OUT), StockTakeService (ADJUST) deu goi qua day,
 * khong tu sua Stock/StockTransaction truc tiep.
 */
@Service
@RequiredArgsConstructor
public class StockService {

    private final StockRepository stockRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final StockAlertService stockAlertService;

    public List<Stock> findAll() {
        return stockRepository.findAll();
    }

    public BigDecimal currentQuantity(Long productId, Long warehouseId) {
        return stockRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .map(Stock::getQuantity)
                .orElse(BigDecimal.ZERO);
    }

    // IN-03: tang ton kho khi nhap hang.
    @Transactional
    public void increase(Product product, Warehouse warehouse, BigDecimal quantity, String referenceType, Long referenceId) {
        Stock stock = findOrCreateStock(product, warehouse);
        stock.setQuantity(stock.getQuantity().add(quantity));
        stock.setUpdatedAt(LocalDateTime.now());
        stockRepository.save(stock);

        saveTransaction(product, warehouse, "IN", quantity, referenceType, referenceId);
        stockAlertService.refreshStatus(product, warehouse, stock.getQuantity());
    }

    // SALE-05: giam ton kho khi xac nhan don ban - chan neu khong du ton kho.
    @Transactional
    public void decrease(Product product, Warehouse warehouse, BigDecimal quantity, String referenceType, Long referenceId) {
        Stock stock = stockRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .orElseThrow(() -> ApiException.conflict(
                        "Khong du ton kho cho san pham " + product.getCode() + " tai kho " + warehouse.getCode()));

        if (stock.getQuantity().compareTo(quantity) < 0) {
            throw ApiException.conflict(
                    "Khong du ton kho cho san pham " + product.getCode() + " tai kho " + warehouse.getCode()
                            + " (con " + stock.getQuantity() + ", can " + quantity + ")");
        }

        stock.setQuantity(stock.getQuantity().subtract(quantity));
        stock.setUpdatedAt(LocalDateTime.now());
        stockRepository.save(stock);

        saveTransaction(product, warehouse, "OUT", quantity, referenceType, referenceId);
        stockAlertService.refreshStatus(product, warehouse, stock.getQuantity());
    }

    // Kiem tra truoc khi xac nhan don ban (khong ghi gi ca) de bao loi ro rang truoc khi tru bat ky dong nao.
    public void assertSufficientStock(Product product, Warehouse warehouse, BigDecimal quantity) {
        BigDecimal current = currentQuantity(product.getId(), warehouse.getId());
        if (current.compareTo(quantity) < 0) {
            throw ApiException.conflict(
                    "Khong du ton kho cho san pham " + product.getCode() + " tai kho " + warehouse.getCode()
                            + " (con " + current + ", can " + quantity + ")");
        }
    }

    // INV-04: ghi nhan chenh lech sau kiem ke, dat lai ton kho = so luong thuc te.
    @Transactional
    public void adjust(Product product, Warehouse warehouse, BigDecimal actualQuantity, String referenceType, Long referenceId) {
        Stock stock = findOrCreateStock(product, warehouse);
        BigDecimal difference = actualQuantity.subtract(stock.getQuantity());

        stock.setQuantity(actualQuantity);
        stock.setUpdatedAt(LocalDateTime.now());
        stockRepository.save(stock);

        if (difference.compareTo(BigDecimal.ZERO) != 0) {
            saveTransaction(product, warehouse, "ADJUST", difference, referenceType, referenceId);
        }
        stockAlertService.refreshStatus(product, warehouse, stock.getQuantity());
    }

    private Stock findOrCreateStock(Product product, Warehouse warehouse) {
        return stockRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .orElseGet(() -> {
                    Stock s = new Stock();
                    s.setProduct(product);
                    s.setWarehouse(warehouse);
                    s.setQuantity(BigDecimal.ZERO);
                    return s;
                });
    }

    private void saveTransaction(Product product, Warehouse warehouse, String type, BigDecimal quantity,
                                  String referenceType, Long referenceId) {
        StockTransaction tx = new StockTransaction();
        tx.setProduct(product);
        tx.setWarehouse(warehouse);
        tx.setType(type);
        tx.setQuantity(quantity);
        tx.setReferenceType(referenceType);
        tx.setReferenceId(referenceId);
        tx.setCreatedAt(LocalDateTime.now());
        stockTransactionRepository.save(tx);
    }
}
