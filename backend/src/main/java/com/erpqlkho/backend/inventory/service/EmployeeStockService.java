package com.erpqlkho.backend.inventory.service;

import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.entity.EmployeeStock;
import com.erpqlkho.backend.inventory.repository.EmployeeStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

// "Kho NV" (App Van-Sale) - so phu ben trong Kho Van chi nhanh, xem EmployeeStock.java. Goi SONG
// SONG voi StockService (Kho Van chi nhanh that) tu VanSaleAdvanceService/VanSaleReturnService/
// InvoiceService.createVanSale() - khong bao gio goi rieng le 1 minh.
@Service
@RequiredArgsConstructor
public class EmployeeStockService {

    private final EmployeeStockRepository employeeStockRepository;

    public List<EmployeeStock> findByEmployee(Long employeeId) {
        return employeeStockRepository.findByEmployeeId(employeeId);
    }

    public BigDecimal currentQuantity(Long employeeId, Long productId) {
        return employeeStockRepository.findByEmployeeIdAndProductId(employeeId, productId)
                .map(EmployeeStock::getQuantity)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional
    public void increase(Employee employee, Product product, BigDecimal baseQuantity) {
        EmployeeStock stock = findOrCreate(employee, product);
        stock.setQuantity(stock.getQuantity().add(baseQuantity));
        stock.setUpdatedAt(LocalDateTime.now());
        employeeStockRepository.save(stock);
    }

    @Transactional
    public void decrease(Employee employee, Product product, BigDecimal baseQuantity) {
        EmployeeStock stock = findOrCreate(employee, product);
        if (stock.getQuantity().compareTo(baseQuantity) < 0) {
            throw ApiException.conflict("Kho cua nhan vien " + employee.getFullName() + " khong du san pham "
                    + product.getCode() + " (dang co " + stock.getQuantity().stripTrailingZeros().toPlainString()
                    + ", can " + baseQuantity.stripTrailingZeros().toPlainString() + ")");
        }
        stock.setQuantity(stock.getQuantity().subtract(baseQuantity));
        stock.setUpdatedAt(LocalDateTime.now());
        employeeStockRepository.save(stock);
    }

    private EmployeeStock findOrCreate(Employee employee, Product product) {
        return employeeStockRepository.findByEmployeeIdAndProductId(employee.getId(), product.getId())
                .orElseGet(() -> {
                    EmployeeStock stock = new EmployeeStock();
                    stock.setEmployee(employee);
                    stock.setProduct(product);
                    stock.setQuantity(BigDecimal.ZERO);
                    return stock;
                });
    }
}
