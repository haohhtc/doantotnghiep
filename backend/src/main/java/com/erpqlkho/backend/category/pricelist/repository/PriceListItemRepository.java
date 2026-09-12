package com.erpqlkho.backend.category.pricelist.repository;

import com.erpqlkho.backend.category.pricelist.entity.PriceListItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PriceListItemRepository extends JpaRepository<PriceListItem, Long> {
    List<PriceListItem> findByPriceListId(Long priceListId);
    List<PriceListItem> findByPriceListIdAndProductId(Long priceListId, Long productId);
    boolean existsByPriceListIdAndProductIdAndUomId(Long priceListId, Long productId, Long uomId);
}
