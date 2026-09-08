package com.erpqlkho.backend.category.district.repository;

import com.erpqlkho.backend.category.district.entity.District;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DistrictRepository extends JpaRepository<District, Long> {
    List<District> findByProvinceId(Long provinceId);
    boolean existsByCode(String code);
}
