package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.VanSaleReturn;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VanSaleReturnRepository extends JpaRepository<VanSaleReturn, Long> {
    boolean existsByDocNumber(String docNumber);
}
