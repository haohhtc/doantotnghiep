package com.erpqlkho.backend.sales.service;

import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.repository.CustomerRepository;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uomgroup.service.UomConversionService;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.sales.dto.DeliveryOrderDto;
import com.erpqlkho.backend.sales.dto.SalesOrderDto;
import com.erpqlkho.backend.sales.entity.SalesOrder;
import com.erpqlkho.backend.sales.entity.SalesOrderDetail;
import com.erpqlkho.backend.sales.repository.SalesOrderRepository;
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

// SALE-01..05: tao/quan ly don hang ban, xac nhan (SALE-05) chi duyet don - KHONG tru kho (xem
// V33: kho chi tru khi Xac nhan Don giao hang tao tu don nay, o DeliveryOrderService).
@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NumberingConfigService numberingConfigService;
    private final UomConversionService uomConversionService;
    private final AvailabilityService availabilityService;
    private final DeliveryOrderService deliveryOrderService;

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
        availabilityService.assertAvailable(order.getWarehouse(), order.getDetails(), null);

        return salesOrderRepository.save(order);
    }

    @Transactional
    public SalesOrder update(Long id, SalesOrderDto dto) {
        SalesOrder order = findById(id);
        requirePending(order);
        applyDto(order, dto);
        availabilityService.assertAvailable(order.getWarehouse(), order.getDetails(), order.getId());
        return salesOrderRepository.save(order);
    }

    @Transactional
    public void delete(Long id) {
        SalesOrder order = findById(id);
        requirePending(order);
        salesOrderRepository.delete(order);
    }

    // SALE-05: xac nhan don hang - duyet don (khong tru kho nua, xem V33) VA tu dong tao luon Don
    // giao hang (DRAFT, copy nguyen so luong/DVT tu don) de hien san tren man hinh "Don giao hang"
    // - nguoi dung khong can tu bam "+" chon lai don nua. Kho chi thuc su tru khi Xac nhan Don
    // giao hang o buoc rieng (DeliveryOrderService.confirm(), trang "Xac nhan giao hang") - dung
    // chuoi DMS goc SO (duyet + tu tao DO) -> Xac nhan DO (tru kho).
    @Transactional
    public SalesOrder confirm(Long id) {
        SalesOrder order = findById(id);
        requirePending(order);
        availabilityService.assertAvailable(order.getWarehouse(), order.getDetails(), order.getId());

        order.setStatus("CONFIRMED");
        order.setConfirmedBy(currentUser());
        SalesOrder saved = salesOrderRepository.save(order);

        DeliveryOrderDto doDto = new DeliveryOrderDto();
        doDto.setSalesOrderId(saved.getId());
        deliveryOrderService.create(doDto);

        return saved;
    }

    @Transactional
    public SalesOrder cancel(Long id) {
        SalesOrder order = findById(id);
        requirePending(order);
        order.setStatus("CANCELLED");
        return salesOrderRepository.save(order);
    }

    private void applyDto(SalesOrder order, SalesOrderDto dto) {
        String orderType = dto.getOrderType() == null || dto.getOrderType().isBlank() ? "STANDARD" : dto.getOrderType();
        if (!List.of("PRE_ORDER", "SAMPLE", "STANDARD").contains(orderType)) {
            throw ApiException.conflict("Loai don hang khong hop le: " + orderType);
        }
        Warehouse warehouse = findWarehouse(dto.getWarehouseId());
        if ("PRE_ORDER".equals(orderType)) {
            if (dto.getDeliveryDate() == null) {
                throw ApiException.conflict("Don Pre-order bat buoc phai chon Ngay giao hang");
            }
            if (!"MAIN".equals(warehouse.getWarehouseType())) {
                throw ApiException.conflict("Don Pre-order bat buoc xuat tu Kho chinh (Main)");
            }
        }

        order.setOrderType(orderType);
        order.setDeliveryDate(dto.getDeliveryDate());
        order.setDocDate(dto.getDocDate());
        order.setCustomer(findCustomer(dto.getCustomerId()));
        order.setWarehouse(warehouse);

        order.getDetails().clear();
        List<SalesOrderDetail> details = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (SalesOrderDto.DetailDto detailDto : dto.getDetails()) {
            SalesOrderDetail detail = new SalesOrderDetail();
            detail.setSalesOrder(order);
            Product product = findProduct(detailDto.getProductId());
            Uom uom = uomConversionService.findUom(detailDto.getUomId());
            detail.setProduct(product);
            detail.setUom(uom);
            detail.setQuantity(detailDto.getQuantity());
            detail.setBaseQuantity(uomConversionService.toBase(product, uom, detailDto.getQuantity()));
            // Don mau: mien phi, ep don gia = 0 bat ke client gui gi.
            BigDecimal unitPrice = "SAMPLE".equals(orderType) ? BigDecimal.ZERO : detailDto.getUnitPrice();
            detail.setUnitPrice(unitPrice);
            BigDecimal amount = detailDto.getQuantity().multiply(unitPrice);
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
        return numberingConfigService.nextNumber("SALES_ORDER");
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
