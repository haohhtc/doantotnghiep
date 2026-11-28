package com.erpqlkho.backend.inventory.service;

import com.erpqlkho.backend.category.branch.entity.Branch;
import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.category.employee.repository.EmployeeRepository;
import com.erpqlkho.backend.category.employee.service.EmployeeService;
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
    private final EmployeeService employeeService;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final StockService stockService;
    private final EmployeeStockService employeeStockService;
    private final NumberingConfigService numberingConfigService;
    private final UomConversionService uomConversionService;
    private final InventoryEventPublisher inventoryEventPublisher;

    // @Transactional (du chi readOnly) BAT BUOC o day - resolveCurrentBranch() co the phai lazy-
    // load RouteMaster cua 1 RouteSalesmanAssignment (quan he LAZY), neu khong co session Hibernate
    // dang mo luc goi se nem LazyInitializationException "no Session" (da gap that khi test).
    @Transactional(readOnly = true)
    public List<VanSaleAdvance> findAll() {
        List<VanSaleAdvance> all = vanSaleAdvanceRepository.findAll();
        all.forEach(this::enrichResolvedBranch);
        return all;
    }

    @Transactional(readOnly = true)
    public VanSaleAdvance findById(Long id) {
        VanSaleAdvance advance = vanSaleAdvanceRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phieu ung hang id=" + id));
        enrichResolvedBranch(advance);
        return advance;
    }

    // NVBH thuong KHONG gan san user.branch (chi nhanh suy dong tu Tuyen - xem resolveCurrentBranch())
    // nen gan tam chi nhanh suy ra duoc vao object tra ve (CHI trong bo nho, KHONG luu xuong DB) de
    // Frontend loc dung theo Chi nhanh dang chon o Header - giong cach EmployeeService.findByCurrentUser()
    // da lam cho App Van-Sale.
    private void enrichResolvedBranch(VanSaleAdvance advance) {
        Employee employee = advance.getEmployee();
        if (employee != null && employee.getUser() != null && employee.getUser().getBranch() == null) {
            employee.getUser().setBranch(employeeService.resolveCurrentBranch(employee));
        }
    }

    @Transactional
    public VanSaleAdvance create(VanSaleAdvanceDto dto) {
        VanSaleAdvance advance = new VanSaleAdvance();
        advance.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        advance.setStatus("DRAFT");
        advance.setCreatedBy(currentUser());
        applyDto(advance, dto);

        VanSaleAdvance saved = vanSaleAdvanceRepository.save(advance);
        // Bao realtime cho Web NGAY luc tao (truoc day bao o confirm() - khong con dung nua vi
        // confirm() gio do chinh thu kho tren Web tu bam, khong can tu bao cho minh; cai can bao
        // that su la "co yeu cau Ung hang moi dang cho xac nhan"). Kem branchId (chi nhanh NVBH
        // nay dang phu trach, suy tu Tuyen - xem resolveCurrentBranch()) de Frontend loc dung chi
        // nhanh, khong hien bao sang chi nhanh khac.
        Branch branch = employeeService.resolveCurrentBranch(saved.getEmployee());
        inventoryEventPublisher.publish("ADVANCE", saved.getEmployee().getFullName(),
                branch == null ? null : branch.getId(), saved.getEmployee().getId(), saved.getDocNumber());
        return saved;
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
            employeeStockService.increase(advance.getEmployee(), item.getProduct(), item.getBaseQuantity(), "VAN_SALE_ADVANCE", advance.getId());
        }

        advance.setStatus("CLOSED");
        VanSaleAdvance saved = vanSaleAdvanceRepository.save(advance);
        // Bao rieng cho App Van-Sale (NVBH co phieu vua duoc duyet) - khac eventType voi luc tao
        // (ADVANCE) de App phan biet duoc "co phieu moi" (khong lien quan, NVBH khac tao) voi
        // "phieu CUA MINH vua duoc duyet" (employeeId khop voi chinh minh).
        inventoryEventPublisher.publish("ADVANCE_CONFIRMED", saved.getEmployee().getFullName(),
                van.getBranch().getId(), saved.getEmployee().getId(), saved.getDocNumber());
        return saved;
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

    // Kho Main/Van suy tu chi nhanh cua NVBH nay - uu tien user.branch (NV kho/quan ly), neu rong
    // thi suy tu Tuyen ban hang dang phu trach (xem EmployeeService.resolveCurrentBranch()).
    private Warehouse mainWarehouseOf(Employee employee) {
        return resolveWarehouse(employee, "MAIN");
    }

    private Warehouse vanWarehouseOf(Employee employee) {
        return resolveWarehouse(employee, "VAN");
    }

    private Warehouse resolveWarehouse(Employee employee, String warehouseType) {
        Branch branch = employeeService.resolveCurrentBranch(employee);
        if (branch == null) {
            throw ApiException.conflict("Nhan vien " + employee.getFullName() + " chua gan tai khoan/chi nhanh/tuyen, khong xac dinh duoc kho");
        }
        return warehouseRepository.findFirstByBranchIdAndWarehouseType(branch.getId(), warehouseType)
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
