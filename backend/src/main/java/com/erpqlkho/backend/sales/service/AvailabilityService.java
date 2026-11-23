package com.erpqlkho.backend.sales.service;

import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.service.EmployeeStockService;
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
    private final EmployeeStockService employeeStockService;

    // excludeOrderId: don dang sua/duyet (da nam san trong "Da dat hang") - null neu la don moi.
    // salesman: CHI truyen cho don Van-Sales (STANDARD, xuat tu Kho Van) co gan NVBH cu the - khi
    // do kiem tra dung so luong NVBH NAY dang cam ("Kho NV", xem EmployeeStock.java), KHONG tru
    // theo "Da dat hang" cua ca Kho Van chi nhanh (cach cu, sai ban chat: 20 cai NVBH dang cam la
    // CUA RIENG ho, khong lien quan gi den cac don hang KHAC dang giu cho tai Kho Van chung - phat
    // hien thuc te khi test: Ung hang xong van khong ban duoc du Kho NV con du, vi cong thuc cu
    // luon tru di ton dong cua CAC don khac). Null -> giu nguyen logic cu (Pre-order/don thuong,
    // noi nhieu khach THAT SU tranh chap chung 1 kho).
    public void assertAvailable(Warehouse warehouse, List<SalesOrderDetail> lines, Long excludeOrderId, Employee salesman) {
        // Cung 1 san pham co the len nhieu dong (khac DVT) -> cong lai truoc khi so voi ton.
        Map<Long, BigDecimal> requested = new LinkedHashMap<>();
        Map<Long, Product> products = new LinkedHashMap<>();
        for (SalesOrderDetail line : lines) {
            Long productId = line.getProduct().getId();
            products.putIfAbsent(productId, line.getProduct());
            requested.merge(productId, line.getBaseQuantity(), BigDecimal::add);
        }

        boolean checkEmployeeStock = salesman != null && "VAN".equals(warehouse.getWarehouseType());
        Long exclude = excludeOrderId == null ? -1L : excludeOrderId;
        for (Map.Entry<Long, BigDecimal> entry : requested.entrySet()) {
            BigDecimal available;
            if (checkEmployeeStock) {
                available = employeeStockService.currentQuantity(salesman.getId(), entry.getKey());
            } else {
                BigDecimal actual = stockService.currentQuantity(entry.getKey(), warehouse.getId());
                BigDecimal committed = salesOrderRepository.sumCommittedBase(entry.getKey(), warehouse.getId(), exclude);
                available = actual.subtract(committed);
            }
            if (entry.getValue().compareTo(available) > 0) {
                String message = checkEmployeeStock
                        ? "Số lượng đặt vượt quá số lượng NVBH " + salesman.getFullName() + " đang cầm! (Sản phẩm "
                                + products.get(entry.getKey()).getCode() + ": cần " + plain(entry.getValue())
                                + ", NVBH đang cầm " + plain(available) + ")"
                        : "Số lượng đặt vượt quá số lượng Sẵn sàng bán hiện có trong kho! (Sản phẩm "
                                + products.get(entry.getKey()).getCode() + ": cần " + plain(entry.getValue())
                                + ", sẵn sàng bán " + plain(available) + ")";
                throw ApiException.conflict(message);
            }
        }
    }

    private String plain(BigDecimal v) {
        return v.stripTrailingZeros().toPlainString();
    }
}
