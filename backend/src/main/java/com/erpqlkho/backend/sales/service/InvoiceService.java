package com.erpqlkho.backend.sales.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uomgroup.service.UomConversionService;
import com.erpqlkho.backend.inventory.service.StockService;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.sales.dto.InvoiceDto;
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
import java.util.Objects;

// Xuat hoa don TU DUNG 1 dot giao hang cu the (DeliveryOrder) da Xac nhan (V49) - 1 dot giao co
// the tach thanh NHIEU hoa don (xuat tung phan), chon tung dong/so luong muon xuat (<= con lai
// chua xuat hoa don cua dot giao do). Don gia lay tu SalesOrderDetail goc. Chot cung thue
// (product.saleTaxGroup.ratePercent tai thoi diem xuat) vao invoice_item.
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final DeliveryOrderRepository deliveryOrderRepository;
    private final SalesReturnRepository salesReturnRepository;
    private final ProductRepository productRepository;
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
    public Invoice create(InvoiceDto dto) {
        DeliveryOrder deliveryOrder = findDeliveryOrder(dto.getDeliveryOrderId());
        if (!"CLOSED".equals(deliveryOrder.getStatus())) {
            throw ApiException.conflict("Dot giao hang nay chua duoc Xac nhan - phai giao hang xong moi xuat duoc hoa don");
        }
        SalesOrder order = deliveryOrder.getSalesOrder();

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(resolveInvoiceNumber());
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setSalesOrder(order);
        invoice.setDeliveryOrder(deliveryOrder);
        invoice.setCreatedBy(currentUser());
        invoice.setCreatedAt(java.time.LocalDateTime.now());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        List<InvoiceItem> items = new ArrayList<>();
        for (InvoiceDto.ItemDto itemDto : dto.getItems()) {
            Product product = findProduct(itemDto.getProductId());
            DeliveryOrderItem doLine = deliveryOrder.getItems().stream()
                    .filter(i -> i.getProduct().getId().equals(product.getId()))
                    .findFirst()
                    .orElseThrow(() -> ApiException.conflict("San pham " + product.getCode() + " khong co trong dot giao hang nay"));
            Uom uom = itemDto.getUomId() != null ? uomConversionService.findUom(itemDto.getUomId()) : doLine.getUom();
            BigDecimal baseQuantity = uomConversionService.toBase(product, uom, itemDto.getQuantity());

            BigDecimal unitPrice = unitPriceOf(order, product, uom);
            BigDecimal rate = product.getSaleTaxGroup() != null ? product.getSaleTaxGroup().getRatePercent() : BigDecimal.ZERO;
            BigDecimal lineSubtotal = itemDto.getQuantity().multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTax = lineSubtotal.multiply(rate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineSubtotal.add(lineTax);

            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
            item.setProduct(product);
            item.setUom(uom);
            item.setQuantity(itemDto.getQuantity());
            item.setBaseQuantity(baseQuantity);
            item.setUnitPrice(unitPrice);
            item.setTaxRate(rate);
            item.setLineTaxAmount(lineTax);
            item.setLineTotal(lineTotal);
            items.add(item);

            subtotal = subtotal.add(lineSubtotal);
            totalTax = totalTax.add(lineTax);
        }
        assertWithinRemaining(deliveryOrder, items, null);

        invoice.getItems().addAll(items);
        invoice.setSubtotalAmount(subtotal);
        invoice.setTaxAmount(totalTax);
        invoice.setTotalAmount(subtotal.add(totalTax));

        Invoice saved = invoiceRepository.save(invoice);

        // Xuat hoa don = hang roi Kho Van cho khach: tru ton thuc te o Kho Van (V38), DUNG DUNG so
        // luong cua hoa don nay (co the chi la 1 PHAN dot giao - V49), khong phai nguyen ca dot.
        if (deliveryOrder.getVanWarehouse() != null) {
            for (InvoiceItem item : items) {
                stockService.decrease(item.getProduct(), deliveryOrder.getVanWarehouse(), item.getBaseQuantity(),
                        "INVOICE", saved.getId());
            }
        }
        return saved;
    }

    // Tong so luong (don vi co so) con lai CHUA xuat hoa don cua 1 san pham trong 1 dot giao hang =
    // so luong da giao (DeliveryOrderItem) tru tong da xuat o cac Hoa don dang hoat dong (khong
    // CANCELLED) cua CHINH dot giao do. excludeInvoiceId: bo qua chinh hoa don dang xet (null khi
    // tao moi, vi hoa don moi chua ton tai nen khong can loai).
    private BigDecimal remainingToInvoice(DeliveryOrder deliveryOrder, Long productId, Long excludeInvoiceId) {
        BigDecimal delivered = deliveryOrder.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .map(DeliveryOrderItem::getBaseQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal invoiced = invoiceRepository.findByDeliveryOrderIdAndStatusNot(deliveryOrder.getId(), "CANCELLED").stream()
                .filter(inv -> excludeInvoiceId == null || !inv.getId().equals(excludeInvoiceId))
                .flatMap(inv -> inv.getItems().stream())
                .filter(item -> item.getProduct().getId().equals(productId))
                .map(this::resolveBaseQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return delivered.subtract(invoiced);
    }

    // Chan xuat hoa don vuot qua con lai - tinh tong theo tung san pham (cong don neu hoa don co
    // nhieu dong cung san pham, vd 2 DVT khac nhau trong cung 1 lan xuat).
    private void assertWithinRemaining(DeliveryOrder deliveryOrder, List<InvoiceItem> items, Long excludeInvoiceId) {
        var requestedByProduct = items.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        item -> item.getProduct().getId(),
                        java.util.stream.Collectors.reducing(BigDecimal.ZERO, InvoiceItem::getBaseQuantity, BigDecimal::add)));
        for (var entry : requestedByProduct.entrySet()) {
            BigDecimal remaining = remainingToInvoice(deliveryOrder, entry.getKey(), excludeInvoiceId);
            if (entry.getValue().compareTo(remaining) > 0) {
                Product product = findProduct(entry.getKey());
                throw ApiException.conflict("San pham " + product.getCode() + " xuat hoa don vuot qua so luong con lai cua dot giao hang nay (con lai "
                        + remaining.stripTrailingZeros().toPlainString() + ")");
            }
        }
    }

    // Huy hoa don - hoan tra lai Kho Van DUNG DUNG so luong cua hoa don nay (khong phai ca dot giao -
    // V49). Khong con dung gi den trang thai Don giao hang: dot giao van giu nguyen CLOSED, chi don
    // gian la "con lai chua xuat hoa don" tang tro lai dung bang so vua huy, san sang cho hoa don
    // MOI khac cua chinh dot giao do. Chan neu khach da tra hang dua tren hoa don nay (co phieu Tra
    // hang dang hieu luc, chua bi huy) - nguoc logic nghiep vu.
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

        DeliveryOrder deliveryOrder = resolveDeliveryOrder(invoice);
        if (deliveryOrder != null && deliveryOrder.getVanWarehouse() != null) {
            for (InvoiceItem item : invoice.getItems()) {
                stockService.increase(item.getProduct(), deliveryOrder.getVanWarehouse(),
                        resolveBaseQuantity(item), "INVOICE_CANCEL", invoice.getId());
            }
        }

        invoice.setStatus("CANCELLED");
        return invoiceRepository.save(invoice);
    }

    // Hoa don tao TRUOC V49 khong co deliveryOrder gan san - suy ra bang cach tim lai Don giao hang
    // (gia dinh truoc do chi co 1, dung voi du lieu cu). Hoa don tao SAU V49 luon co san, dung thang.
    private DeliveryOrder resolveDeliveryOrder(Invoice invoice) {
        if (invoice.getDeliveryOrder() != null) return invoice.getDeliveryOrder();
        List<DeliveryOrder> candidates = deliveryOrderRepository.findBySalesOrderIdAndStatusNot(invoice.getSalesOrder().getId(), "CANCELLED");
        return candidates.isEmpty() ? null : candidates.get(0);
    }

    // InvoiceItem tao TRUOC V49 khong co base_quantity - tinh lai tu quantity+uom.
    private BigDecimal resolveBaseQuantity(InvoiceItem item) {
        if (item.getBaseQuantity() != null) return item.getBaseQuantity();
        return uomConversionService.toBase(item.getProduct(), item.getUom(), item.getQuantity());
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
                .filter(d -> Objects.equals(d.getUom() == null ? null : d.getUom().getId(), uomId))
                .findFirst();
        if (exact.isPresent()) return exact.get().getUnitPrice();

        var src = candidates.get(0);
        BigDecimal basePrice = src.getUnitPrice().divide(uomConversionService.factorOf(product, src.getUom()), 6, RoundingMode.HALF_UP);
        return basePrice.multiply(uomConversionService.factorOf(product, uom)).setScale(2, RoundingMode.HALF_UP);
    }

    private String resolveInvoiceNumber() {
        return numberingConfigService.nextNumber("INVOICE");
    }

    private DeliveryOrder findDeliveryOrder(Long id) {
        return deliveryOrderRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don giao hang id=" + id));
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
