package com.erpqlkho.backend.sales.service;

import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.repository.CustomerRepository;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.service.StockService;
import com.erpqlkho.backend.sales.dto.SalesOrderDto;
import com.erpqlkho.backend.sales.entity.SalesOrder;
import com.erpqlkho.backend.sales.entity.SalesOrderDetail;
import com.erpqlkho.backend.sales.repository.SalesOrderRepository;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

// SALE-01..05: tao/quan ly don hang ban, xac nhan se xuat kho (SALE-05) - chan neu thieu ton kho.
@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockService stockService;

    public List<SalesOrder> findAll() {
        return salesOrderRepository.findAll();
    }

    public SalesOrder findById(Long id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don hang id=" + id));
    }

    @Transactional
    public SalesOrder create(SalesOrderDto dto) {
        SalesOrder order = new SalesOrder();
        order.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        order.setStatus("PENDING");
        order.setCreatedBy(currentUser());
        applyDto(order, dto);

        return salesOrderRepository.save(order);
    }

    @Transactional
    public SalesOrder update(Long id, SalesOrderDto dto) {
        SalesOrder order = findById(id);
        requirePending(order);
        applyDto(order, dto);
        return salesOrderRepository.save(order);
    }

    @Transactional
    public void delete(Long id) {
        SalesOrder order = findById(id);
        requirePending(order);
        salesOrderRepository.delete(order);
    }

    // SALE-05: xac nhan don hang - kiem tra du ton kho cho TAT CA dong truoc, sau do moi tru
    // (tranh tru duoc 1 nua roi moi bao loi).
    @Transactional
    public SalesOrder confirm(Long id) {
        SalesOrder order = findById(id);
        requirePending(order);

        for (SalesOrderDetail detail : order.getDetails()) {
            stockService.assertSufficientStock(detail.getProduct(), order.getWarehouse(), detail.getQuantity());
        }
        for (SalesOrderDetail detail : order.getDetails()) {
            stockService.decrease(detail.getProduct(), order.getWarehouse(), detail.getQuantity(),
                    "SALES_ORDER", order.getId());
        }

        order.setStatus("CONFIRMED");
        return salesOrderRepository.save(order);
    }

    @Transactional
    public SalesOrder cancel(Long id) {
        SalesOrder order = findById(id);
        requirePending(order);
        order.setStatus("CANCELLED");
        return salesOrderRepository.save(order);
    }

    private void applyDto(SalesOrder order, SalesOrderDto dto) {
        order.setDocDate(dto.getDocDate());
        order.setCustomer(findCustomer(dto.getCustomerId()));
        order.setWarehouse(findWarehouse(dto.getWarehouseId()));

        order.getDetails().clear();
        List<SalesOrderDetail> details = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (SalesOrderDto.DetailDto detailDto : dto.getDetails()) {
            SalesOrderDetail detail = new SalesOrderDetail();
            detail.setSalesOrder(order);
            detail.setProduct(findProduct(detailDto.getProductId()));
            detail.setQuantity(detailDto.getQuantity());
            detail.setUnitPrice(detailDto.getUnitPrice());
            BigDecimal amount = detailDto.getQuantity().multiply(detailDto.getUnitPrice());
            detail.setAmount(amount);
            total = total.add(amount);
            details.add(detail);
        }
        order.getDetails().addAll(details);
        order.setTotalAmount(total);
    }

    private void requirePending(SalesOrder order) {
        if (!"PENDING".equals(order.getStatus())) {
            throw ApiException.conflict("Don hang khong con o trang thai cho xac nhan");
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (salesOrderRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So don da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return "SO" + String.format("%04d", salesOrderRepository.count() + 1);
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
