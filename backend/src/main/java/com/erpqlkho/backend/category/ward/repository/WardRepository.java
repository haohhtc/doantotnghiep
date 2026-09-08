package com.erpqlkho.backend.category.ward.repository;

import com.erpqlkho.backend.category.ward.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WardRepository extends JpaRepository<Ward, Long> {
    List<Ward> findByDistrictId(Long districtId);
    boolean existsByCode(String code);
}
