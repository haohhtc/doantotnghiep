package com.erpqlkho.backend.sales.service;

import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.category.employee.repository.EmployeeRepository;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uomgroup.service.UomConversionService;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.service.StockService;
import com.erpqlkho.backend.sales.dto.SalesReturnDto;
import com.erpqlkho.backend.sales.entity.SalesReturn;
import com.erpqlkho.backend.sales.entity.SalesReturnItem;
import com.erpqlkho.backend.sales.repository.SalesReturnRepository;
import com.erpqlkho.backend.system.service.NumberingConfigService;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

// Phieu tra hang cua khach: tao/quan ly, duyet se cong ton kho that qua StockService (tai dung
// y het pattern GoodsIssueService).
@Service
@RequiredArgsConstructor
public class SalesReturnService {

    private final SalesReturnRepository salesReturnRepository;
    private final EmployeeRepository employeeRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockService stockService;
    private final NumberingConfigService numberingConfigService;
    private final UomConversionService uomConversionService;

    public List<SalesReturn> findAll() {
        return salesReturnRepository.findAll();
    }

    public SalesReturn findById(Long id) {
        return salesReturnRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phieu tra hang id=" + id));
    }

    @Transactional
    public SalesReturn create(SalesReturnDto dto) {
        SalesReturn ret = new SalesReturn();
        ret.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        ret.setStatus("DRAFT");
        ret.setCreatedBy(currentUser());
        applyDto(ret, dto);

        return salesReturnRepository.save(ret);
    }

    @Transactional
    public SalesReturn update(Long id, SalesReturnDto dto) {
        SalesReturn ret = findById(id);
        requireDraft(ret);
        applyDto(ret, dto);
        return salesReturnRepository.save(ret);
    }

    @Transactional
    public void delete(Long id) {
        SalesReturn ret = findById(id);
        requireDraft(ret);
        salesReturnRepository.delete(ret);
    }

    // Duyet phieu tra hang - cong ton kho + ghi stock_transaction cho tung dong.
    @Transactional
    public SalesReturn confirm(Long id) {
        SalesReturn ret = findById(id);
        requireDraft(ret);

        for (SalesReturnItem item : ret.getItems()) {
            stockService.increase(item.getProduct(), ret.getWarehouse(), item.getBaseQuantity(),
                    "SALES_RETURN", ret.getId());
        }

        ret.setStatus("CLOSED");
        return salesReturnRepository.save(ret);
    }

    private void applyDto(SalesReturn ret, SalesReturnDto dto) {
        ret.setDocDate(dto.getDocDate());
        ret.setSalesman(findSalesman(dto.getSalesmanId()));
        ret.setWarehouse(findWarehouse(dto.getWarehouseId()));
        ret.setReason(dto.getReason());
        ret.setRemarks(dto.getRemarks());

        ret.getItems().clear();
        List<SalesReturnItem> items = new ArrayList<>();
        for (SalesReturnDto.ItemDto itemDto : dto.getItems()) {
            SalesReturnItem item = new SalesReturnItem();
            item.setSalesReturn(ret);
            Product product = findProduct(itemDto.getProductId());
            Uom uom = uomConversionService.findUom(itemDto.getUomId());
            item.setProduct(product);
            item.setUom(uom);
            item.setQuantity(itemDto.getQuantity());
            item.setBaseQuantity(uomConversionService.toBase(product, uom, itemDto.getQuantity()));
            item.setNote(itemDto.getNote());
            items.add(item);
        }
        ret.getItems().addAll(items);
    }

    private void requireDraft(SalesReturn ret) {
        if (!"DRAFT".equals(ret.getStatus())) {
            throw ApiException.conflict("Phieu tra hang da duyet, khong the sua/xoa");
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (salesReturnRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So phieu da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return numberingConfigService.nextNumber("SALES_RETURN");
    }

    private Employee findSalesman(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nhan vien id=" + id));
        if (!"NVBH".equals(employee.getType())) {
            throw ApiException.conflict("Chi chon duoc nhan vien ban hang (NVBH) cho phieu tra hang");
        }
        return employee;
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
