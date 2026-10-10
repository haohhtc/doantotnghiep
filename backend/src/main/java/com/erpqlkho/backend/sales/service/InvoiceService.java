package com.erpqlkho.backend.sales.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uomgroup.service.UomConversionService;
import com.erpqlkho.backend.inventory.service.StockService;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.sales.entity.DeliveryOrder;
import com.erpqlkho.backend.sales.entity.DeliveryOrderItem;
import com.erpqlkho.backend.sales.entity.Invoice;
import com.erpqlkho.backend.sales.entity.InvoiceItem;
import com.erpqlkho.backend.sales.entity.SalesOrder;
import com.erpqlkho.backend.sales.repository.DeliveryOrderRepository;
import com.erpqlkho.backend.sales.repository.InvoiceRepository;
import com.erpqlkho.backend.sales.repository.SalesOrderRepository;
import com.erpqlkho.backend.sales.repository.SalesReturnRepository;
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

// Xuat hoa don SAU KHI Don giao hang da Xac nhan (xem V33) - chot theo dung SO LUONG GIAO THUC TE
// (co the khac so luong dat), don gia lay tu SalesOrderDetail goc. Chot cung thue
// (product.saleTaxGroup.ratePercent tai thoi diem xuat) vao invoice_item.
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final DeliveryOrderRepository deliveryOrderRepository;
    private final SalesReturnRepository salesReturnRepository;
    private final UserRepository userRepository;
    private final NumberingConfigService numberingConfigService;
    private final UomConversionService uomConversionService;
    private final StockService stockService;

    public List<Invoice> findAll() {
        return invoiceRepository.findAll();
    }

    public Invoice findById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay hoa don id=" + id));
    }

    @Transactional
    public Invoice createFromSalesOrder(Long salesOrderId) {
        SalesOrder order = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don hang id=" + salesOrderId));

        // Chi xuat hoa don SAU KHI da giao hang xong (Don giao hang da Xac nhan) - dung chuoi
        // DMS goc SO -> DO -> IN, va chot dung so luong GIAO THUC TE (co the khac so luong dat).
        DeliveryOrder deliveryOrder = deliveryOrderRepository.findBySalesOrderIdAndStatusNot(salesOrderId, "CANCELLED")
                .orElseThrow(() -> ApiException.conflict("Don hang nay chua co Don giao hang - phai tao va Xac nhan giao hang truoc khi xuat hoa don"));
        if (!"CLOSED".equals(deliveryOrder.getStatus())) {
            throw ApiException.conflict("Don giao hang cua don hang nay chua duoc Xac nhan - phai giao hang xong moi xuat duoc hoa don");
        }
        if (invoiceRepository.existsBySalesOrderIdAndStatusNot(salesOrderId, "CANCELLED")) {
            throw ApiException.conflict("Don hang nay da duoc xuat hoa don roi");
        }

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(resolveInvoiceNumber());
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setSalesOrder(order);
        invoice.setCreatedBy(currentUser());
        invoice.setCreatedAt(java.time.LocalDateTime.now());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        List<InvoiceItem> items = new ArrayList<>();
        for (DeliveryOrderItem detail : deliveryOrder.getItems()) {
            BigDecimal unitPrice = unitPriceOf(order, detail.getProduct(), detail.getUom());
            BigDecimal rate = detail.getProduct().getSaleTaxGroup() != null
                    ? detail.getProduct().getSaleTaxGroup().getRatePercent()
                    : BigDecimal.ZERO;
            BigDecimal lineSubtotal = detail.getQuantity().multiply(unitPrice)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTax = lineSubtotal.multiply(rate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineSubtotal.add(lineTax);

            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
            item.setProduct(detail.getProduct());
            item.setUom(detail.getUom());
            item.setQuantity(detail.getQuantity());
            item.setUnitPrice(unitPrice);
            item.setTaxRate(rate);
            item.setLineTaxAmount(lineTax);
            item.setLineTotal(lineTotal);
            items.add(item);

            subtotal = subtotal.add(lineSubtotal);
            totalTax = totalTax.add(lineTax);
        }
        invoice.getItems().addAll(items);
        invoice.setSubtotalAmount(subtotal);
        invoice.setTaxAmount(totalTax);
        invoice.setTotalAmount(subtotal.add(totalTax));

        Invoice saved = invoiceRepository.save(invoice);

        // Xuat hoa don = hang roi Kho Van cho khach: tru ton thuc te o Kho Van (V38). Don giao cu
        // (van_warehouse_id null) da tru thang ton luc xac nhan giao nen khong tru them.
        if (deliveryOrder.getVanWarehouse() != null) {
            for (DeliveryOrderItem item : deliveryOrder.getItems()) {
                stockService.decrease(item.getProduct(), deliveryOrder.getVanWarehouse(), item.getBaseQuantity(),
                        "INVOICE", saved.getId());
            }
        }
        return saved;
    }

    // Huy hoa don - hoan tra lai Kho Van (dung so da tru luc xuat hoa don), mo lai Don giao hang ve
    // DRAFT de co the Xac nhan lai (hien lai nut "Xuat hoa don" o Don hang ban). KHONG duoc xoa
    // vanWarehouse: hang VAT LY van dang nam o Van (chua tung chuyen nguoc ve Main) - giu lai de
    // DeliveryOrderService.confirm() biet ma KHONG chuyen kho Main->Van lan 2 khi Xac nhan lai (se
    // tru/cong trung neu xoa). Chan neu khach da tra hang dua tren hoa don nay (co phieu Tra hang
    // dang hieu luc, chua bi huy) - nguoc logic nghiep vu.
    @Transactional
    public Invoice cancel(Long id) {
        Invoice invoice = findById(id);
        if ("CANCELLED".equals(invoice.getStatus())) {
            throw ApiException.conflict("Hoa don da bi huy roi");
        }
        boolean hasActiveReturn = salesReturnRepository.findBySalesOrderId(invoice.getSalesOrder().getId()).stream()
                .anyMatch(r -> !"CANCELLED".equals(r.getStatus()));
        if (hasActiveReturn) {
            throw ApiException.conflict("Khach da tra hang dua tren hoa don nay - phai huy phieu Tra hang truoc khi huy Hoa don");
        }

        DeliveryOrder deliveryOrder = deliveryOrderRepository.findBySalesOrderIdAndStatusNot(invoice.getSalesOrder().getId(), "CANCELLED")
                .orElseThrow(() -> ApiException.notFound("Khong tim thay Don giao hang cua hoa don nay"));
        if (deliveryOrder.getVanWarehouse() != null) {
            for (DeliveryOrderItem item : deliveryOrder.getItems()) {
                stockService.increase(item.getProduct(), deliveryOrder.getVanWarehouse(), item.getBaseQuantity(),
                        "INVOICE_CANCEL", invoice.getId());
            }
        }
        deliveryOrder.setStatus("DRAFT");
        deliveryOrder.setConfirmedBy(null);
        deliveryOrderRepository.save(deliveryOrder);

        invoice.setStatus("CANCELLED");
        return invoiceRepository.save(invoice);
    }

    // Don gia chot hoa don lay theo gia da thoa thuan luc dat hang (SalesOrderDetail); Don giao hang chi
    // doi SO LUONG (va co the doi DVT giao). Khop dong cung san pham + cung DVT truoc; neu DVT giao khac
    // DVT tren don thi QUY DOI gia: gia co so = gia don / he so DVT don, nhan he so DVT giao
    // (VD don 1 Thung 720.000, giao 5 Hop (he so 6, thung 96) -> gia Hop = 720.000/96*6 = 45.000).
    private BigDecimal unitPriceOf(SalesOrder order, Product product, Uom uom) {
        Long uomId = uom == null ? null : uom.getId();
        var candidates = order.getDetails().stream()
                .filter(d -> d.getProduct().getId().equals(product.getId())).toList();
        if (candidates.isEmpty()) {
            throw ApiException.conflict("San pham trong Don giao hang khong khop voi Don hang ban goc");
        }
        var exact = candidates.stream()
                .filter(d -> java.util.Objects.equals(d.getUom() == null ? null : d.getUom().getId(), uomId))
                .findFirst();
        if (exact.isPresent()) return exact.get().getUnitPrice();

        var src = candidates.get(0);
        BigDecimal basePrice = src.getUnitPrice().divide(uomConversionService.factorOf(product, src.getUom()), 6, RoundingMode.HALF_UP);
        return basePrice.multiply(uomConversionService.factorOf(product, uom)).setScale(2, RoundingMode.HALF_UP);
    }
    private String resolveInvoiceNumber() {
        return numberingConfigService.nextNumber("INVOICE");
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay user dang dang nhap"));
    }
}
