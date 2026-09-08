package com.erpqlkho.backend.category.region.repository;

import com.erpqlkho.backend.category.region.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegionRepository extends JpaRepository<Region, Long> {
    boolean existsByCode(String code);
}
