package com.erpqlkho.backend.category.pricelist.service;

import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.repository.CustomerRepository;
import com.erpqlkho.backend.category.pricelist.dto.PriceListDto;
import com.erpqlkho.backend.category.pricelist.dto.PriceListItemDto;
import com.erpqlkho.backend.category.pricelist.entity.PriceList;
import com.erpqlkho.backend.category.pricelist.entity.PriceListItem;
import com.erpqlkho.backend.category.pricelist.repository.PriceListItemRepository;
import com.erpqlkho.backend.category.pricelist.repository.PriceListRepository;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uom.repository.UomRepository;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PriceListService {

    private final PriceListRepository priceListRepository;
    private final PriceListItemRepository priceListItemRepository;
    private final ProductRepository productRepository;
    private final UomRepository uomRepository;
    private final CustomerRepository customerRepository;
    private final WarehouseRepository warehouseRepository;

    public List<PriceList> findAll() {
        return priceListRepository.findAll();
    }

    public PriceList findById(Long id) {
        return priceListRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay bang gia id=" + id));
    }

    @Transactional
    public PriceList create(PriceListDto dto) {
        if (priceListRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma bang gia da ton tai: " + dto.getCode());
        }
        PriceList priceList = new PriceList();
        priceList.setCode(dto.getCode());
        priceList.setName(dto.getName());
        priceList.setType(dto.getType() != null ? dto.getType() : "STANDARD");
        priceList.setStartDate(dto.getStartDate());
        priceList.setEndDate(dto.getEndDate());
        priceList.setActive(dto.getActive() == null || dto.getActive());
        return priceListRepository.save(priceList);
    }

    @Transactional
    public PriceList update(Long id, PriceListDto dto) {
        PriceList priceList = findById(id);
        if (!priceList.getCode().equals(dto.getCode()) && priceListRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma bang gia da ton tai: " + dto.getCode());
        }
        priceList.setCode(dto.getCode());
        priceList.setName(dto.getName());
        priceList.setType(dto.getType() != null ? dto.getType() : "STANDARD");
        priceList.setStartDate(dto.getStartDate());
        priceList.setEndDate(dto.getEndDate());
        if (dto.getActive() != null) {
            priceList.setActive(dto.getActive());
        }
        return priceListRepository.save(priceList);
    }

    // Xoa that - chan neu dang bi Branch/Customer tham chieu. Xoa het dong gia ben trong truoc
    // (giong pattern UomGroup xoa het UomConversion truoc khi xoa nhom).
    @Transactional
    public void delete(Long id) {
        PriceList priceList = findById(id);
        try {
            priceListItemRepository.deleteAll(priceListItemRepository.findByPriceListId(id));
            priceListRepository.delete(priceList);
            priceListRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: bang gia dang duoc chi nhanh/khach hang khac su dung");
        }
    }

    // --- Dong gia trong bang gia ---

    public List<PriceListItem> findItems(Long priceListId) {
        findById(priceListId);
        return priceListItemRepository.findByPriceListId(priceListId);
    }

    @Transactional
    public PriceListItem addItem(Long priceListId, PriceListItemDto dto) {
        PriceList priceList = findById(priceListId);
        Product product = findProduct(dto.getProductId());
        Uom uom = findUom(dto.getUomId());

        if (priceListItemRepository.existsByPriceListIdAndProductIdAndUomId(priceListId, dto.getProductId(), dto.getUomId())) {
            throw ApiException.conflict("San pham + don vi tinh nay da co gia trong bang gia");
        }

        PriceListItem item = new PriceListItem();
        item.setPriceList(priceList);
        item.setProduct(product);
        item.setUom(uom);
        item.setPrice(dto.getPrice());
        item.setCreatedAt(LocalDateTime.now());
        return priceListItemRepository.save(item);
    }

    @Transactional
    public void removeItem(Long priceListId, Long itemId) {
        PriceListItem item = priceListItemRepository.findById(itemId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay dong gia id=" + itemId));
        if (!item.getPriceList().getId().equals(priceListId)) {
            throw ApiException.notFound("Dong gia nay khong thuoc bang gia id=" + priceListId);
        }
        priceListItemRepository.delete(item);
    }

    // --- Tra gia tu dong: customer.price_list_id -> branch.price_list_id (qua warehouse) ->
    // product.price (fallback cuoi cung). Xem tonghop.md muc "Bang gia" de biet ly do chon thu tu nay.

    public BigDecimal lookupPrice(Long productId, Long customerId, Long warehouseId) {
        Product product = findProduct(productId);

        if (customerId != null) {
            Customer customer = customerRepository.findById(customerId).orElse(null);
            if (customer != null && customer.getPriceList() != null) {
                Optional<BigDecimal> price = pickPrice(customer.getPriceList().getId(), productId, product);
                if (price.isPresent()) return price.get();
            }
        }

        if (warehouseId != null) {
            Warehouse warehouse = warehouseRepository.findById(warehouseId).orElse(null);
            if (warehouse != null && warehouse.getBranch() != null && warehouse.getBranch().getPriceList() != null) {
                Optional<BigDecimal> price = pickPrice(warehouse.getBranch().getPriceList().getId(), productId, product);
                if (price.isPresent()) return price.get();
            }
        }

        return product.getPrice();
    }

    // Uu tien dong gia trung uom mac dinh cua san pham (product.uom); neu khong co thi lay dong
    // dau tien tim thay trong bang gia do cho san pham nay.
    private Optional<BigDecimal> pickPrice(Long priceListId, Long productId, Product product) {
        List<PriceListItem> items = priceListItemRepository.findByPriceListIdAndProductId(priceListId, productId);
        if (items.isEmpty()) return Optional.empty();
        if (product.getUom() != null) {
            Optional<PriceListItem> matched = items.stream()
                    .filter(i -> i.getUom().getId().equals(product.getUom().getId()))
                    .findFirst();
            if (matched.isPresent()) return Optional.of(matched.get().getPrice());
        }
        return Optional.of(items.get(0).getPrice());
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay san pham id=" + id));
    }

    private Uom findUom(Long id) {
        return uomRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don vi tinh id=" + id));
    }
}
