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
import com.erpqlkho.backend.inventory.dto.VanSaleReturnDto;
import com.erpqlkho.backend.inventory.entity.VanSaleReturn;
import com.erpqlkho.backend.inventory.entity.VanSaleReturnItem;
import com.erpqlkho.backend.inventory.repository.VanSaleReturnRepository;
import com.erpqlkho.backend.system.service.NumberingConfigService;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

// "Tra hang" (App Van-Sale) - chieu NGUOC lai VanSaleAdvanceService: NVBH tra hang con du cuoi
// ngay ve Kho Main. Duyet se chuyen Van->Main CHI NHANH that VA tru "Kho NV" cua dung nguoi tra
// (chan neu vuot so dang co - xem EmployeeStockService.decrease()).
@Service
@RequiredArgsConstructor
public class VanSaleReturnService {

    private final VanSaleReturnRepository vanSaleReturnRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final StockService stockService;
    private final EmployeeStockService employeeStockService;
    private final NumberingConfigService numberingConfigService;
    private final UomConversionService uomConversionService;

    public List<VanSaleReturn> findAll() {
        return vanSaleReturnRepository.findAll();
    }

    public VanSaleReturn findById(Long id) {
        return vanSaleReturnRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phieu tra hang id=" + id));
    }

    @Transactional
    public VanSaleReturn create(VanSaleReturnDto dto) {
        VanSaleReturn ret = new VanSaleReturn();
        ret.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        ret.setStatus("DRAFT");
        ret.setCreatedBy(currentUser());
        applyDto(ret, dto);

        return vanSaleReturnRepository.save(ret);
    }

    @Transactional
    public VanSaleReturn update(Long id, VanSaleReturnDto dto) {
        VanSaleReturn ret = findById(id);
        requireDraft(ret);
        applyDto(ret, dto);
        return vanSaleReturnRepository.save(ret);
    }

    @Transactional
    public void delete(Long id) {
        VanSaleReturn ret = findById(id);
        requireDraft(ret);
        vanSaleReturnRepository.delete(ret);
    }

    @Transactional
    public VanSaleReturn confirm(Long id) {
        VanSaleReturn ret = findById(id);
        requireDraft(ret);

        Warehouse main = resolveWarehouse(ret.getEmployee(), "MAIN");
        Warehouse van = resolveWarehouse(ret.getEmployee(), "VAN");
        // Chan truoc het tat ca neu co du 1 dong vuot "Kho NV" dang co, tranh tru nua chung roi
        // moi loi (EmployeeStockService.decrease() da tu chan, nhung kiem tra het truoc van tot hon).
        for (VanSaleReturnItem item : ret.getItems()) {
            java.math.BigDecimal current = employeeStockService.currentQuantity(ret.getEmployee().getId(), item.getProduct().getId());
            if (current.compareTo(item.getBaseQuantity()) < 0) {
                throw ApiException.conflict("Kho cua nhan vien " + ret.getEmployee().getFullName() + " khong du san pham "
                        + item.getProduct().getCode() + " de tra (dang co " + current.stripTrailingZeros().toPlainString()
                        + ", can tra " + item.getBaseQuantity().stripTrailingZeros().toPlainString() + ")");
            }
        }
        for (VanSaleReturnItem item : ret.getItems()) {
            stockService.decrease(item.getProduct(), van, item.getBaseQuantity(), "VAN_SALE_RETURN", ret.getId());
            stockService.increase(item.getProduct(), main, item.getBaseQuantity(), "VAN_SALE_RETURN", ret.getId());
            employeeStockService.decrease(ret.getEmployee(), item.getProduct(), item.getBaseQuantity(), "VAN_SALE_RETURN", ret.getId());
        }

        ret.setStatus("CLOSED");
        return vanSaleReturnRepository.save(ret);
    }

    private void applyDto(VanSaleReturn ret, VanSaleReturnDto dto) {
        ret.setDocDate(dto.getDocDate());
        ret.setEmployee(findEmployee(dto.getEmployeeId()));
        ret.setReason(dto.getReason());
        ret.setRemarks(dto.getRemarks());

        ret.getItems().clear();
        List<VanSaleReturnItem> items = new ArrayList<>();
        for (VanSaleReturnDto.ItemDto itemDto : dto.getItems()) {
            Product product = findProduct(itemDto.getProductId());
            Uom uom = itemDto.getUomId() != null ? uomConversionService.findUom(itemDto.getUomId()) : null;
            VanSaleReturnItem item = new VanSaleReturnItem();
            item.setVanSaleReturn(ret);
            item.setProduct(product);
            item.setUom(uom);
            item.setQuantity(itemDto.getQuantity());
            item.setBaseQuantity(uomConversionService.toBase(product, uom, itemDto.getQuantity()));
            items.add(item);
        }
        ret.getItems().addAll(items);
    }

    private Warehouse resolveWarehouse(Employee employee, String warehouseType) {
        if (employee.getUser() == null || employee.getUser().getBranch() == null) {
            throw ApiException.conflict("Nhan vien " + employee.getFullName() + " chua gan tai khoan/chi nhanh, khong xac dinh duoc kho");
        }
        Long branchId = employee.getUser().getBranch().getId();
        return warehouseRepository.findFirstByBranchIdAndWarehouseType(branchId, warehouseType)
                .orElseThrow(() -> ApiException.conflict("Chi nhanh cua nhan vien nay chua co Kho " + warehouseType));
    }

    private void requireDraft(VanSaleReturn ret) {
        if (!"DRAFT".equals(ret.getStatus())) {
            throw ApiException.conflict("Phieu tra hang da duyet, khong the sua/xoa");
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (vanSaleReturnRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So phieu da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return numberingConfigService.nextNumber("VAN_SALE_RETURN");
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
