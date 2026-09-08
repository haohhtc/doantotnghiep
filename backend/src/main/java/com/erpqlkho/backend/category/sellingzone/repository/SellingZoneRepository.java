package com.erpqlkho.backend.category.sellingzone.repository;

import com.erpqlkho.backend.category.sellingzone.entity.SellingZone;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellingZoneRepository extends JpaRepository<SellingZone, Long> {
    boolean existsByCode(String code);
}
