package com.erpqlkho.backend.inventory.service;

import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.entity.EmployeeStock;
import com.erpqlkho.backend.inventory.entity.EmployeeStockTransaction;
import com.erpqlkho.backend.inventory.repository.EmployeeStockRepository;
import com.erpqlkho.backend.inventory.repository.EmployeeStockTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// "Kho NV" (App Van-Sale) - so phu ben trong Kho Van chi nhanh, xem EmployeeStock.java. Goi SONG
// SONG voi StockService (Kho Van chi nhanh that) tu VanSaleAdvanceService/VanSaleReturnService/
// InvoiceService.createVanSale() - khong bao gio goi rieng le 1 minh.
@Service
@RequiredArgsConstructor
public class EmployeeStockService {

    private final EmployeeStockRepository employeeStockRepository;
    private final EmployeeStockTransactionRepository employeeStockTransactionRepository;

    public List<EmployeeStock> findByEmployee(Long employeeId) {
        return employeeStockRepository.findByEmployeeId(employeeId);
    }

    public BigDecimal currentQuantity(Long employeeId, Long productId) {
        return employeeStockRepository.findByEmployeeIdAndProductId(employeeId, productId)
                .map(EmployeeStock::getQuantity)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional
    public void increase(Employee employee, Product product, BigDecimal baseQuantity, String referenceType, Long referenceId) {
        EmployeeStock stock = findOrCreate(employee, product);
        stock.setQuantity(stock.getQuantity().add(baseQuantity));
        stock.setUpdatedAt(LocalDateTime.now());
        employeeStockRepository.save(stock);
        saveTransaction(employee, product, "IN", baseQuantity, referenceType, referenceId);
    }

    @Transactional
    public void decrease(Employee employee, Product product, BigDecimal baseQuantity, String referenceType, Long referenceId) {
        EmployeeStock stock = findOrCreate(employee, product);
        if (stock.getQuantity().compareTo(baseQuantity) < 0) {
            throw ApiException.conflict("Kho cua nhan vien " + employee.getFullName() + " khong du san pham "
                    + product.getCode() + " (dang co " + stock.getQuantity().stripTrailingZeros().toPlainString()
                    + ", can " + baseQuantity.stripTrailingZeros().toPlainString() + ")");
        }
        stock.setQuantity(stock.getQuantity().subtract(baseQuantity));
        stock.setUpdatedAt(LocalDateTime.now());
        employeeStockRepository.save(stock);
        saveTransaction(employee, product, "OUT", baseQuantity, referenceType, referenceId);
    }

    // "Dau ngay / Da nhan / Da xuat / Con lai" cho 1 nhan vien trong 1 ngay - man hinh Tong quan
    // cua app (yeu cau cua tv2, giong cot trong anh tham khao "Danh sach san pham - Ton kho nhan
    // vien"). Con lai = so du hien tai (EmployeeStock.quantity, luon dung real-time). Dau ngay =
    // Con lai - Da nhan (hom nay) + Da xuat (hom nay) - tinh nguoc lai, khong luu rieng.
    public List<DailySummary> dailySummary(Long employeeId, LocalDate date) {
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.plusDays(1).atStartOfDay();

        Map<Long, BigDecimal> receivedToday = new HashMap<>();
        Map<Long, BigDecimal> issuedToday = new HashMap<>();
        for (EmployeeStockTransactionRepository.ProductTypeTotal row
                : employeeStockTransactionRepository.sumByEmployeeAndTypeBetween(employeeId, from, to)) {
            if ("IN".equals(row.getType())) {
                receivedToday.put(row.getProductId(), row.getTotal());
            } else {
                issuedToday.put(row.getProductId(), row.getTotal());
            }
        }

        List<EmployeeStock> balances = employeeStockRepository.findByEmployeeId(employeeId);
        List<DailySummary> result = new ArrayList<>();
        for (EmployeeStock balance : balances) {
            Long productId = balance.getProduct().getId();
            BigDecimal conLai = balance.getQuantity();
            BigDecimal daNhan = receivedToday.getOrDefault(productId, BigDecimal.ZERO);
            BigDecimal daXuat = issuedToday.getOrDefault(productId, BigDecimal.ZERO);
            BigDecimal dauNgay = conLai.subtract(daNhan).add(daXuat);
            result.add(new DailySummary(balance.getProduct(), dauNgay, daNhan, daXuat, conLai));
        }
        return result;
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

    private void saveTransaction(Employee employee, Product product, String type, BigDecimal quantity,
                                  String referenceType, Long referenceId) {
        EmployeeStockTransaction tx = new EmployeeStockTransaction();
        tx.setEmployee(employee);
        tx.setProduct(product);
        tx.setType(type);
        tx.setQuantity(quantity);
        tx.setReferenceType(referenceType);
        tx.setReferenceId(referenceId);
        tx.setCreatedAt(LocalDateTime.now());
        employeeStockTransactionRepository.save(tx);
    }

    public record DailySummary(Product product, BigDecimal dauNgay, BigDecimal daNhan, BigDecimal daXuat, BigDecimal conLai) {
    }
}
