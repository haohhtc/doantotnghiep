package com.erpqlkho.backend.sales.service;

import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.repository.CustomerRepository;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.sales.dto.SalesRequestDto;
import com.erpqlkho.backend.sales.entity.SalesOrder;
import com.erpqlkho.backend.sales.entity.SalesOrderDetail;
import com.erpqlkho.backend.sales.entity.SalesRequest;
import com.erpqlkho.backend.sales.entity.SalesRequestItem;
import com.erpqlkho.backend.sales.repository.SalesOrderRepository;
import com.erpqlkho.backend.sales.repository.SalesRequestRepository;
import com.erpqlkho.backend.system.service.NumberingConfigService;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

// Yeu cau ban hang (SR): tao/quan ly khi con DRAFT, roi Chuyen thanh Don hang ban (SO moi,
// PENDING) - xem SalesRequest.java + V34. Chua dung gi den ton kho (SR khong co kho xuat).
@Service
@RequiredArgsConstructor
public class SalesRequestService {

    private final SalesRequestRepository salesRequestRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NumberingConfigService numberingConfigService;

    public List<SalesRequest> findAll() {
        return salesRequestRepository.findAll();
    }

    public SalesRequest findById(Long id) {
        return salesRequestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay yeu cau ban hang id=" + id));
    }

    @Transactional
    public SalesRequest create(SalesRequestDto dto) {
        SalesRequest request = new SalesRequest();
        request.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        request.setStatus("DRAFT");
        request.setCreatedBy(currentUser());
        applyDto(request, dto);

        return salesRequestRepository.save(request);
    }

    @Transactional
    public SalesRequest update(Long id, SalesRequestDto dto) {
        SalesRequest request = findById(id);
        requireDraft(request);
        applyDto(request, dto);
        return salesRequestRepository.save(request);
    }

    @Transactional
    public void delete(Long id) {
        SalesRequest request = findById(id);
        requireDraft(request);
        salesRequestRepository.delete(request);
    }

    // Chuyen Yeu cau ban hang thanh Don hang ban chinh thuc (PENDING) - copy nguyen san
    // pham/so luong/don gia, chon kho xuat luc chuyen (SR chua co kho). Danh so don moi binh
    // thuong qua NumberingConfigService, khong dung lai so cua SR.
    @Transactional
    public SalesOrder convert(Long id, Long warehouseId) {
        SalesRequest request = findById(id);
        requireDraft(request);
        Warehouse warehouse = findWarehouse(warehouseId);

        SalesOrder order = new SalesOrder();
        order.setDocNumber(numberingConfigService.nextNumber("SALES_ORDER"));
        order.setDocDate(request.getDocDate());
        order.setCustomer(request.getCustomer());
        order.setWarehouse(warehouse);
        order.setStatus("PENDING");
        order.setCreatedBy(currentUser());
        order.setSalesRequest(request);

        List<SalesOrderDetail> details = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (SalesRequestItem item : request.getItems()) {
            SalesOrderDetail detail = new SalesOrderDetail();
            detail.setSalesOrder(order);
            detail.setProduct(item.getProduct());
            detail.setQuantity(item.getQuantity());
            detail.setUnitPrice(item.getUnitPrice());
            BigDecimal amount = item.getQuantity().multiply(item.getUnitPrice());
            detail.setAmount(amount);
            total = total.add(amount);
            details.add(detail);
        }
        order.getDetails().addAll(details);
        order.setTotalAmount(total);

        salesOrderRepository.save(order);

        request.setStatus("CONVERTED");
        salesRequestRepository.save(request);

        return order;
    }

    private void applyDto(SalesRequest request, SalesRequestDto dto) {
        request.setDocDate(dto.getDocDate());
        request.setCustomer(findCustomer(dto.getCustomerId()));
        request.setRemarks(dto.getRemarks());

        request.getItems().clear();
        List<SalesRequestItem> items = new ArrayList<>();
        for (SalesRequestDto.ItemDto itemDto : dto.getItems()) {
            SalesRequestItem item = new SalesRequestItem();
            item.setSalesRequest(request);
            item.setProduct(findProduct(itemDto.getProductId()));
            item.setQuantity(itemDto.getQuantity());
            item.setUnitPrice(itemDto.getUnitPrice());
            items.add(item);
        }
        request.getItems().addAll(items);
    }

    private void requireDraft(SalesRequest request) {
        if (!"DRAFT".equals(request.getStatus())) {
            throw ApiException.conflict("Yeu cau ban hang da chuyen thanh don hang, khong the sua/xoa/chuyen lai");
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (salesRequestRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So phieu da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return numberingConfigService.nextNumber("SALES_REQUEST");
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

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay user dang dang nhap"));
    }
}
