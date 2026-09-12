package com.erpqlkho.backend.category.pricelist.repository;

import com.erpqlkho.backend.category.pricelist.entity.PriceList;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PriceListRepository extends JpaRepository<PriceList, Long> {
    boolean existsByCode(String code);
}
