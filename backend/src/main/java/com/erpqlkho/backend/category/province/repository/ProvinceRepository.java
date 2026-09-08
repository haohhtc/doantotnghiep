package com.erpqlkho.backend.category.province.repository;

import com.erpqlkho.backend.category.province.entity.Province;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProvinceRepository extends JpaRepository<Province, Long> {
    List<Province> findByRegionId(Long regionId);
    boolean existsByCode(String code);
}
