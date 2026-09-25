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
import com.erpqlkho.backend.category.product.repository.ItemBranchRepository;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.uom.entity.Uom;
import com.erpqlkho.backend.category.uom.repository.UomRepository;
import com.erpqlkho.backend.category.uomgroup.service.UomConversionService;
import com.erpqlkho.backend.category.warehouse.entity.Warehouse;
import com.erpqlkho.backend.category.warehouse.repository.WarehouseRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PriceListService {

    private static final Set<String> VALID_TYPES = Set.of("PURCHASE", "SALE");

    private final PriceListRepository priceListRepository;
    private final PriceListItemRepository priceListItemRepository;
    private final ProductRepository productRepository;
    private final UomRepository uomRepository;
    private final CustomerRepository customerRepository;
    private final WarehouseRepository warehouseRepository;
    private final ItemBranchRepository itemBranchRepository;
    private final UomConversionService uomConversionService;

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
        priceList.setType(validateType(dto.getType()));
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
        priceList.setType(validateType(dto.getType()));
        priceList.setStartDate(dto.getStartDate());
        priceList.setEndDate(dto.getEndDate());
        if (dto.getActive() != null) {
            priceList.setActive(dto.getActive());
        }
        return priceListRepository.save(priceList);
    }

    private String validateType(String type) {
        if (type == null || !VALID_TYPES.contains(type)) {
            throw new ApiException("Loai bang gia phai la PURCHASE hoac SALE");
        }
        return type;
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
        // Khong cho xoa dong gia cua SP dang duoc phan bo o chi nhanh nao do (chi cho sua gia) -
        // don/phieu cu khong bi anh huong vi unitPrice da chot cung tung dong, rule nay chi bao ve
        // tinh nhat quan cho don/phieu MOI sau nay - xem tonghop.md Nhom 4.
        if (itemBranchRepository.existsByProductId(item.getProduct().getId())) {
            throw ApiException.conflict("Khong the xoa: san pham nay dang duoc phan bo o mot chi nhanh - chi duoc sua gia, khong duoc xoa");
        }
        priceListItemRepository.delete(item);
    }

    // --- Tra gia tu dong: customer.price_list_id -> branch.price_list_id (qua warehouse), chi xet
    // dung bang gia co type = purpose (PURCHASE/SALE). KHONG con fallback ve product.price (da bi
    // xoa cot o V19) - khong tim duoc gia hop le thi nem loi ro rang, chan tao/xac nhan phieu.
    // Xem tonghop.md muc "Nhi dat hang lon" Nhom 4.

    public BigDecimal lookupPrice(Long productId, Long customerId, Long warehouseId, String purpose, Long uomId) {
        Product product = findProduct(productId);

        if (customerId != null) {
            Customer customer = customerRepository.findById(customerId).orElse(null);
            if (customer != null && customer.getPriceList() != null && purpose.equals(customer.getPriceList().getType())) {
                Optional<BigDecimal> price = pickPrice(customer.getPriceList().getId(), productId, product, purpose, uomId);
                if (price.isPresent()) return price.get();
            }
        }

        if (warehouseId != null) {
            Warehouse warehouse = warehouseRepository.findById(warehouseId).orElse(null);
            if (warehouse != null && warehouse.getBranch() != null && warehouse.getBranch().getPriceList() != null
                    && purpose.equals(warehouse.getBranch().getPriceList().getType())) {
                Optional<BigDecimal> price = pickPrice(warehouse.getBranch().getPriceList().getId(), productId, product, purpose, uomId);
                if (price.isPresent()) return price.get();
            }
        }

        throw new ApiException("Không tìm thấy giá " + ("SALE".equals(purpose) ? "bán" : "mua")
                + " hợp lệ cho sản phẩm \"" + product.getName() + "\" - vui lòng cấu hình bảng giá trước");
    }

    // DVT can gia: uomId nguoi dung chon -> (khong co) sale_uom/purchase_uom cua san pham. Co dong gia
    // dung DVT do thi lay thang; khong co thi SUY RA tu 1 dong gia khac: gia co so = gia / he so cua dong
    // do, roi nhan he so DVT can tim (VD co gia HOP 40.000, he so 12 -> gia GOI = 3.333,33, THUNG x144).
    // Khong chon DVT nao va san pham cung khong co DVT mac dinh -> lay dong dau (nhu truoc).
    private Optional<BigDecimal> pickPrice(Long priceListId, Long productId, Product product, String purpose, Long uomId) {
        List<PriceListItem> items = priceListItemRepository.findByPriceListIdAndProductId(priceListId, productId);
        if (items.isEmpty()) return Optional.empty();
        Uom defaultUom = "SALE".equals(purpose) ? product.getSaleUom() : product.getPurchaseUom();
        Long targetUomId = uomId != null ? uomId : (defaultUom != null ? defaultUom.getId() : null);
        if (targetUomId == null) return Optional.of(items.get(0).getPrice());

        Optional<PriceListItem> exact = items.stream().filter(i -> i.getUom().getId().equals(targetUomId)).findFirst();
        if (exact.isPresent()) return Optional.of(exact.get().getPrice());

        PriceListItem source = items.get(0);
        Uom target = uomRepository.findById(targetUomId).orElse(null);
        BigDecimal basePrice = source.getPrice().divide(uomConversionService.factorOf(product, source.getUom()), 6, RoundingMode.HALF_UP);
        return Optional.of(basePrice.multiply(uomConversionService.factorOf(product, target)).setScale(2, RoundingMode.HALF_UP));
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
