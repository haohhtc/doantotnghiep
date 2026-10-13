package com.erpqlkho.backend.sales.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uomgroup.service.UomConversionService;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.inventory.service.StockService;
import com.erpqlkho.backend.sales.dto.DeliveryOrderDto;
import com.erpqlkho.backend.sales.entity.DeliveryOrder;
import com.erpqlkho.backend.sales.entity.DeliveryOrderItem;
import com.erpqlkho.backend.sales.entity.Invoice;
import com.erpqlkho.backend.sales.entity.SalesOrder;
import com.erpqlkho.backend.sales.entity.SalesOrderDetail;
import com.erpqlkho.backend.sales.repository.DeliveryOrderRepository;
import com.erpqlkho.backend.sales.repository.InvoiceRepository;
import com.erpqlkho.backend.sales.repository.SalesOrderRepository;
import com.erpqlkho.backend.system.service.NumberingConfigService;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Don giao hang (DO): tao tu 1 Don hang ban da CONFIRMED (moi SO toi da 1 DO). Xac nhan DO
// (DRAFT -> CLOSED) moi that su tru ton kho theo dung so luong GIAO THUC TE cua tung dong (co the
// khac so luong da dat) - xem DeliveryOrder.java.
@Service
@RequiredArgsConstructor
public class DeliveryOrderService {

    private final DeliveryOrderRepository deliveryOrderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final InvoiceRepository invoiceRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockService stockService;
    private final NumberingConfigService numberingConfigService;
    private final UomConversionService uomConversionService;

    public List<DeliveryOrder> findAll() {
        return deliveryOrderRepository.findAll();
    }

    public DeliveryOrder findById(Long id) {
        return deliveryOrderRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don giao hang id=" + id));
    }

    // V49: 1 Don hang ban co the tao NHIEU Don giao hang (giao nhieu dot) - khong con chan "da co
    // DGH roi" nhu truoc, thay bang kiem tra TUNG DONG khong duoc vuot qua so luong CON LAI chua
    // giao (= da dat - tong da giao o cac dot truoc, cong don tren moi don vi co so).
    @Transactional
    public DeliveryOrder create(DeliveryOrderDto dto) {
        SalesOrder salesOrder = findSalesOrder(dto.getSalesOrderId());
        if (!"CONFIRMED".equals(salesOrder.getStatus())) {
            throw ApiException.conflict("Chi tao duoc Don giao hang tu Don hang ban da duyet (CONFIRMED)");
        }

        DeliveryOrder order = new DeliveryOrder();
        order.setDocNumber(resolveDocNumber(dto.getDocNumber()));
        order.setDocDate(dto.getDocDate() != null ? dto.getDocDate() : LocalDate.now());
        order.setSalesOrder(salesOrder);
        order.setWarehouse(dto.getWarehouseId() != null ? findWarehouse(dto.getWarehouseId()) : salesOrder.getWarehouse());
        order.setRemarks(dto.getRemarks());
        order.setStatus("DRAFT");
        order.setCreatedBy(currentUser());

        List<DeliveryOrderItem> items = new ArrayList<>();
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            for (DeliveryOrderDto.ItemDto itemDto : dto.getItems()) {
                items.add(buildItem(order, salesOrder, itemDto));
            }
        } else {
            // Khong truyen items: mac dinh lay het phan CON LAI chua giao cua tung dong (khong
            // phai nguyen so luong da dat nhu truoc - se vuot qua con lai neu da giao 1 phan roi).
            for (SalesOrderDetail detail : salesOrder.getDetails()) {
                BigDecimal remaining = remainingToDeliver(salesOrder, detail.getProduct().getId(), null);
                if (remaining.signum() <= 0) continue;
                DeliveryOrderItem item = new DeliveryOrderItem();
                item.setDeliveryOrder(order);
                item.setProduct(detail.getProduct());
                item.setUom(detail.getUom());
                BigDecimal factor = uomConversionService.factorOf(detail.getProduct(), detail.getUom());
                item.setBaseQuantity(remaining);
                item.setQuantity(remaining.divide(factor, 3, RoundingMode.HALF_UP));
                items.add(item);
            }
        }
        assertWithinRemaining(salesOrder, items, null);
        order.getItems().addAll(items);

        return deliveryOrderRepository.save(order);
    }

    // Tong so luong (don vi co so) con lai chua giao cua 1 san pham trong 1 don hang = tong da dat
    // (cong don moi dong trung san pham, khac DVT) tru tong da giao o CAC don giao hang dang hoat
    // dong (khong CANCELLED) cua chinh don hang do. excludeDeliveryOrderId: bo qua chinh DGH dang
    // sua (null neu dang tao moi) de khong tu tru voi chinh no.
    private BigDecimal remainingToDeliver(SalesOrder salesOrder, Long productId, Long excludeDeliveryOrderId) {
        BigDecimal ordered = salesOrder.getDetails().stream()
                .filter(d -> d.getProduct().getId().equals(productId))
                .map(SalesOrderDetail::getBaseQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal delivered = deliveryOrderRepository.findBySalesOrderIdAndStatusNot(salesOrder.getId(), "CANCELLED").stream()
                .filter(d -> excludeDeliveryOrderId == null || !d.getId().equals(excludeDeliveryOrderId))
                .flatMap(d -> d.getItems().stream())
                .filter(item -> item.getProduct().getId().equals(productId))
                .map(DeliveryOrderItem::getBaseQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return ordered.subtract(delivered);
    }

    // Chan giao vuot qua con lai - tinh tong theo tung san pham (cong don neu 1 DGH co nhieu dong
    // cung san pham, vd 2 DVT khac nhau).
    private void assertWithinRemaining(SalesOrder salesOrder, List<DeliveryOrderItem> items, Long excludeDeliveryOrderId) {
        var requestedByProduct = items.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        item -> item.getProduct().getId(),
                        java.util.stream.Collectors.reducing(BigDecimal.ZERO, DeliveryOrderItem::getBaseQuantity, BigDecimal::add)));
        for (var entry : requestedByProduct.entrySet()) {
            BigDecimal remaining = remainingToDeliver(salesOrder, entry.getKey(), excludeDeliveryOrderId);
            if (entry.getValue().compareTo(remaining) > 0) {
                Product product = findProduct(entry.getKey());
                throw ApiException.conflict("San pham " + product.getCode() + " giao vuot qua so luong con lai cua don hang (con lai "
                        + remaining.stripTrailingZeros().toPlainString() + ")");
            }
        }
    }

    @Transactional
    public DeliveryOrder update(Long id, DeliveryOrderDto dto) {
        DeliveryOrder order = findById(id);
        requireDraft(order);

        if (dto.getDocDate() != null) order.setDocDate(dto.getDocDate());
        if (dto.getWarehouseId() != null) order.setWarehouse(findWarehouse(dto.getWarehouseId()));
        order.setRemarks(dto.getRemarks());

        if (dto.getItems() != null) {
            List<DeliveryOrderItem> items = new ArrayList<>();
            for (DeliveryOrderDto.ItemDto itemDto : dto.getItems()) {
                items.add(buildItem(order, order.getSalesOrder(), itemDto));
            }
            assertWithinRemaining(order.getSalesOrder(), items, order.getId());
            order.getItems().clear();
            order.getItems().addAll(items);
        }

        return deliveryOrderRepository.save(order);
    }

    // DVT: lay theo dto neu co, khong thi lay DVT cua dong cung san pham trong Don hang ban goc.
    private DeliveryOrderItem buildItem(DeliveryOrder order, SalesOrder salesOrder, DeliveryOrderDto.ItemDto itemDto) {
        Product product = findProduct(itemDto.getProductId());
        Uom uom = itemDto.getUomId() != null
                ? uomConversionService.findUom(itemDto.getUomId())
                : salesOrder.getDetails().stream()
                        .filter(d -> d.getProduct().getId().equals(product.getId()))
                        .map(SalesOrderDetail::getUom)
                        .findFirst().orElse(null);
        DeliveryOrderItem item = new DeliveryOrderItem();
        item.setDeliveryOrder(order);
        item.setProduct(product);
        item.setUom(uom);
        item.setQuantity(itemDto.getQuantity());
        item.setBaseQuantity(uomConversionService.toBase(product, uom, itemDto.getQuantity()));
        item.setNote(itemDto.getNote());
        return item;
    }

    @Transactional
    public void delete(Long id) {
        DeliveryOrder order = findById(id);
        requireDraft(order);
        deliveryOrderRepository.delete(order);
    }

    // Xac nhan giao hang - chuyen hang Main -> Van theo dung so luong giao thuc te cua tung dong (base_quantity),
    // chan neu Kho Main khong du ton thuc te.
    @Transactional
    public DeliveryOrder confirm(Long id) {
        DeliveryOrder order = findById(id);
        requireDraft(order);

        // Mo hinh 2 tang (V38): hang chuyen tu kho xuat (Main) sang Kho Van cua CUNG chi nhanh - Main giam
        // ton thuc te (cung luc "Da dat hang" cua don het tinh vi Don giao hang da CLOSED), Van tang. Ton
        // thuc te chi giam han o Kho Van khi xuat Hoa don. Don xuat thang tu Kho Van thi hang da nam san
        // o do, khong chuyen kho.
        //
        // RE-CONFIRM sau khi Huy Hoa don (InvoiceService.cancel() dua DO nay ve DRAFT nhung KHONG xoa
        // vanWarehouse - hang that su van dang nam o Van, chua tung chuyen nguoc ve Main): neu
        // vanWarehouse DA CO SAN (!= null) tuc la lan Xac nhan truoc do da chuyen kho that roi, KHONG
        // duoc chuyen kho lan 2 (se tru/cong trung) - chi can mo lai trang thai CLOSED de xuat hoa don
        // lai duoc. Chi chuyen kho that khi day la lan Xac nhan DAU TIEN (vanWarehouse con null).
        Warehouse source = order.getWarehouse();
        Warehouse van = resolveVanWarehouse(source);
        boolean alreadyMoved = order.getVanWarehouse() != null;
        if (!"VAN".equals(source.getWarehouseType()) && !alreadyMoved) {
            for (DeliveryOrderItem item : order.getItems()) {
                stockService.assertSufficientStock(item.getProduct(), source, item.getBaseQuantity());
            }
            for (DeliveryOrderItem item : order.getItems()) {
                stockService.decrease(item.getProduct(), source, item.getBaseQuantity(), "DELIVERY_ORDER", order.getId());
                stockService.increase(item.getProduct(), van, item.getBaseQuantity(), "DELIVERY_ORDER", order.getId());
            }
        }
        order.setVanWarehouse(van);

        order.setStatus("CLOSED");
        order.setConfirmedBy(currentUser());
        return deliveryOrderRepository.save(order);
    }

    // Huy Don giao hang (V49: khong con dung gi den trang thai Don hang ban - don co the con cac
    // dot giao khac, hoac tao dot giao moi cho phan vua huy bat cu luc nao, khong can "mo lai cho
    // xac nhan" nua). Chan neu CHINH dot giao nay (khong phai ca don hang) da co Hoa don dang hieu
    // luc - phai huy Hoa don do truoc (xem InvoiceService.cancel()). Neu DO dang CLOSED (da xac
    // nhan giao, da chuyen kho Main->Van) thi dao lai dung so da chuyen truoc khi huy.
    @Transactional
    public DeliveryOrder cancel(Long id) {
        DeliveryOrder order = findById(id);
        if ("CANCELLED".equals(order.getStatus())) {
            throw ApiException.conflict("Don giao hang da bi huy roi");
        }
        List<Invoice> activeInvoices = invoiceRepository.findByDeliveryOrderIdAndStatusNot(order.getId(), "CANCELLED");
        if (!activeInvoices.isEmpty()) {
            throw ApiException.conflict("Dot giao hang nay da co Hoa don (" + activeInvoices.get(0).getInvoiceNumber()
                    + ") - phai huy (het) Hoa don truoc khi huy Don giao hang");
        }

        // Dung "vanWarehouse != null" (khong phai status==CLOSED) de biet hang co dang that su nam o
        // Van hay khong - vi sau khi Huy Hoa don, DO co the dang DRAFT nhung vanWarehouse VAN CON (xem
        // InvoiceService.cancel()), tuc hang van nam o Van, phai hoan kho dung cach du dang o trang
        // thai nao.
        Warehouse source = order.getWarehouse();
        Warehouse van = order.getVanWarehouse();
        if (!"VAN".equals(source.getWarehouseType()) && van != null) {
            for (DeliveryOrderItem item : order.getItems()) {
                stockService.decrease(item.getProduct(), van, item.getBaseQuantity(), "DELIVERY_ORDER_CANCEL", order.getId());
                stockService.increase(item.getProduct(), source, item.getBaseQuantity(), "DELIVERY_ORDER_CANCEL", order.getId());
            }
            order.setVanWarehouse(null);
        }

        order.setStatus("CANCELLED");
        return deliveryOrderRepository.save(order);
    }

    private Warehouse resolveVanWarehouse(Warehouse source) {
        if ("VAN".equals(source.getWarehouseType())) return source;
        if (source.getBranch() == null) {
            throw ApiException.conflict("Kho " + source.getCode() + " chua thuoc chi nhanh nao nen khong xac dinh duoc Kho xe tai nhan hang");
        }
        return warehouseRepository.findFirstByBranchIdAndWarehouseType(source.getBranch().getId(), "VAN")
                .orElseThrow(() -> ApiException.conflict("Chi nhanh " + source.getBranch().getCode() + " chua co Kho xe tai (Van) de nhan hang giao"));
    }

    private void requireDraft(DeliveryOrder order) {
        if (!"DRAFT".equals(order.getStatus())) {
            throw ApiException.conflict("Don giao hang da xac nhan, khong the sua/xoa");
        }
    }

    private String resolveDocNumber(String docNumber) {
        if (docNumber != null && !docNumber.isBlank()) {
            if (deliveryOrderRepository.existsByDocNumber(docNumber)) {
                throw ApiException.conflict("So phieu da ton tai: " + docNumber);
            }
            return docNumber;
        }
        return numberingConfigService.nextNumber("DELIVERY_ORDER");
    }

    private SalesOrder findSalesOrder(Long id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don hang id=" + id));
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
