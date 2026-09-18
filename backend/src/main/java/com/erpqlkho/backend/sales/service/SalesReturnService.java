package com.erpqlkho.backend.sales.service;

import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.repository.CustomerRepository;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.service.StockService;
import com.erpqlkho.backend.sales.dto.SalesReturnDto;
import com.erpqlkho.backend.sales.entity.SalesOrder;
import com.erpqlkho.backend.sales.entity.SalesReturn;
import com.erpqlkho.backend.sales.entity.SalesReturnItem;
import com.erpqlkho.backend.sales.repository.SalesOrderRepository;
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
    private final CustomerRepository customerRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final UserRepository userRepository;
    private final StockService stockService;
    private final NumberingConfigService numberingConfigService;

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
            stockService.increase(item.getProduct(), ret.getWarehouse(), item.getQuantity(),
                    "SALES_RETURN", ret.getId());
        }

        ret.setStatus("CLOSED");
        return salesReturnRepository.save(ret);
    }

    private void applyDto(SalesReturn ret, SalesReturnDto dto) {
        ret.setDocDate(dto.getDocDate());
        ret.setCustomer(findCustomer(dto.getCustomerId()));
        ret.setWarehouse(findWarehouse(dto.getWarehouseId()));
        ret.setSalesOrder(findSalesOrder(dto.getSalesOrderId()));
        ret.setReason(dto.getReason());
        ret.setRemarks(dto.getRemarks());

        ret.getItems().clear();
        List<SalesReturnItem> items = new ArrayList<>();
        for (SalesReturnDto.ItemDto itemDto : dto.getItems()) {
            SalesReturnItem item = new SalesReturnItem();
            item.setSalesReturn(ret);
            item.setProduct(findProduct(itemDto.getProductId()));
            item.setQuantity(itemDto.getQuantity());
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

    private Customer findCustomer(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay khach hang id=" + id));
    }

    private Warehouse findWarehouse(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay kho id=" + id));
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay san pham id=" + id));
    }

    private SalesOrder findSalesOrder(Long id) {
        if (id == null) return null;
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don hang id=" + id));
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay user dang dang nhap"));
    }
}
