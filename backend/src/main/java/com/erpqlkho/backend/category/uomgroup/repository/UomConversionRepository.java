package com.erpqlkho.backend.category.uomgroup.repository;

import com.erpqlkho.backend.category.uomgroup.entity.UomConversion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UomConversionRepository extends JpaRepository<UomConversion, Long> {
    List<UomConversion> findByUomGroupId(Long uomGroupId);
    Optional<UomConversion> findByUomGroupIdAndUomId(Long uomGroupId, Long uomId);
    boolean existsByUomGroupIdAndUomId(Long uomGroupId, Long uomId);
}
