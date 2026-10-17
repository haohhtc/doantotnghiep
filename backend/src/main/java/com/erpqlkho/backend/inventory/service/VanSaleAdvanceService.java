package com.erpqlkho.backend.inventory.service;

import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.category.employee.repository.EmployeeRepository;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uomgroup.service.UomConversionService;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.dto.VanSaleAdvanceDto;
import com.erpqlkho.backend.inventory.entity.VanSaleAdvance;
import com.erpqlkho.backend.inventory.entity.VanSaleAdvanceItem;
import com.erpqlkho.backend.inventory.repository.VanSaleAdvanceRepository;
import com.erpqlkho.backend.system.service.NumberingConfigService;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

// "Ung hang" (App Van-Sale) - NVBH nhan hang tu Kho Main nap len "xe" truoc khi di tuyen. Duyet se
// chuyen Main->Van CHI NHANH that (StockService, giong Dieu chuyen kho) VA cong "Kho NV"
// (EmployeeStockService) cua dung nguoi ung - xem VanSaleAdvance.java.
@Service
@RequiredArgsConstructor
public class VanSaleAdvanceService {

    private final VanSaleAdvanceRepository vanSaleAdvanceRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final StockService stockService;
    private final EmployeeStockService employeeStockService;
    private final NumberingConfigService numberingConfigService;
    private final UomConversionService uomConversionService;

    public List<VanSaleAdvance> findAll() {
        return vanSaleAdvanceRepository.findAll();
    }

    public VanSaleAdvance findById(Long id) {
        return vanSaleAdvanceRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phieu ung hang id=" + id));
    }

    @Transactional
    public VanSaleAdvance create(VanSaleAdvanceDto dto) {
        VanSaleAdvance advance = new VanSaleAdvance();
        advance.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        advance.setStatus("DRAFT");
        advance.setCreatedBy(currentUser());
        applyDto(advance, dto);

        return vanSaleAdvanceRepository.save(advance);
    }

    @Transactional
    public VanSaleAdvance update(Long id, VanSaleAdvanceDto dto) {
        VanSaleAdvance advance = findById(id);
        requireDraft(advance);
        applyDto(advance, dto);
        return vanSaleAdvanceRepository.save(advance);
    }

    @Transactional
    public void delete(Long id) {
        VanSaleAdvance advance = findById(id);
        requireDraft(advance);
        vanSaleAdvanceRepository.delete(advance);
    }

    @Transactional
    public VanSaleAdvance confirm(Long id) {
        VanSaleAdvance advance = findById(id);
        requireDraft(advance);

        Warehouse main = mainWarehouseOf(advance.getEmployee());
        Warehouse van = vanWarehouseOf(advance.getEmployee());
        for (VanSaleAdvanceItem item : advance.getItems()) {
            stockService.assertSufficientStock(item.getProduct(), main, item.getBaseQuantity());
        }
        for (VanSaleAdvanceItem item : advance.getItems()) {
            stockService.decrease(item.getProduct(), main, item.getBaseQuantity(), "VAN_SALE_ADVANCE", advance.getId());
            stockService.increase(item.getProduct(), van, item.getBaseQuantity(), "VAN_SALE_ADVANCE", advance.getId());
            employeeStockService.increase(advance.getEmployee(), item.getProduct(), item.getBaseQuantity());
        }

        advance.setStatus("CLOSED");
        return vanSaleAdvanceRepository.save(advance);
    }

    private void applyDto(VanSaleAdvance advance, VanSaleAdvanceDto dto) {
        advance.setDocDate(dto.getDocDate());
        advance.setEmployee(findEmployee(dto.getEmployeeId()));
        advance.setReason(dto.getReason());
        advance.setRemarks(dto.getRemarks());

        advance.getItems().clear();
        List<VanSaleAdvanceItem> items = new ArrayList<>();
        for (VanSaleAdvanceDto.ItemDto itemDto : dto.getItems()) {
            Product product = findProduct(itemDto.getProductId());
            Uom uom = itemDto.getUomId() != null ? uomConversionService.findUom(itemDto.getUomId()) : null;
            VanSaleAdvanceItem item = new VanSaleAdvanceItem();
            item.setVanSaleAdvance(advance);
            item.setProduct(product);
            item.setUom(uom);
            item.setQuantity(itemDto.getQuantity());
            item.setBaseQuantity(uomConversionService.toBase(product, uom, itemDto.getQuantity()));
            items.add(item);
        }
        advance.getItems().addAll(items);
    }

    // Kho Main/Van suy tu chi nhanh cua tai khoan dang nhap gan voi NVBH nay (employee.user.branch) -
    // khong chon tay, giong het cach Yeu cau mua hang lay Chi nhanh tu Header.
    private Warehouse mainWarehouseOf(Employee employee) {
        return resolveWarehouse(employee, "MAIN");
    }

    private Warehouse vanWarehouseOf(Employee employee) {
        return resolveWarehouse(employee, "VAN");
    }

    private Warehouse resolveWarehouse(Employee employee, String warehouseType) {
        if (employee.getUser() == null || employee.getUser().getBranch() == null) {
            throw ApiException.conflict("Nhan vien " + employee.getFullName() + " chua gan tai khoan/chi nhanh, khong xac dinh duoc kho");
        }
        Long branchId = employee.getUser().getBranch().getId();
        return warehouseRepository.findFirstByBranchIdAndWarehouseType(branchId, warehouseType)
                .orElseThrow(() -> ApiException.conflict("Chi nhanh cua nhan vien nay chua co Kho " + warehouseType));
    }

    private void requireDraft(VanSaleAdvance advance) {
        if (!"DRAFT".equals(advance.getStatus())) {
            throw ApiException.conflict("Phieu ung hang da duyet, khong the sua/xoa");
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (vanSaleAdvanceRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So phieu da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return numberingConfigService.nextNumber("VAN_SALE_ADVANCE");
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nhan vien id=" + id));
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
