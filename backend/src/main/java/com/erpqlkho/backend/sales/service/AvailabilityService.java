package com.erpqlkho.backend.sales.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.service.StockService;
import com.erpqlkho.backend.sales.entity.SalesOrderDetail;
import com.erpqlkho.backend.sales.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Chan dat vuot "San sang ban" = Ton thuc te - Da dat hang (tinh theo don vi co so, tai kho xuat cua don).
// Goi khi tao/sua/duyet Don hang ban va khi chuyen Yeu cau ban hang thanh don (luc do moi co kho).
@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final SalesOrderRepository salesOrderRepository;
    private final StockService stockService;

    // excludeOrderId: don dang sua/duyet (da nam san trong "Da dat hang") - null neu la don moi.
    public void assertAvailable(Warehouse warehouse, List<SalesOrderDetail> lines, Long excludeOrderId) {
        // Cung 1 san pham co the len nhieu dong (khac DVT) -> cong lai truoc khi so voi ton.
        Map<Long, BigDecimal> requested = new LinkedHashMap<>();
        Map<Long, Product> products = new LinkedHashMap<>();
        for (SalesOrderDetail line : lines) {
            Long productId = line.getProduct().getId();
            products.putIfAbsent(productId, line.getProduct());
            requested.merge(productId, line.getBaseQuantity(), BigDecimal::add);
        }

        Long exclude = excludeOrderId == null ? -1L : excludeOrderId;
        for (Map.Entry<Long, BigDecimal> entry : requested.entrySet()) {
            BigDecimal actual = stockService.currentQuantity(entry.getKey(), warehouse.getId());
            BigDecimal committed = salesOrderRepository.sumCommittedBase(entry.getKey(), warehouse.getId(), exclude);
            BigDecimal available = actual.subtract(committed);
            if (entry.getValue().compareTo(available) > 0) {
                throw ApiException.conflict("Số lượng đặt vượt quá số lượng Sẵn sàng bán hiện có trong kho! (Sản phẩm "
                        + products.get(entry.getKey()).getCode() + ": cần " + plain(entry.getValue())
                        + ", sẵn sàng bán " + plain(available) + ")");
            }
        }
    }

    private String plain(BigDecimal v) {
        return v.stripTrailingZeros().toPlainString();
    }
}
