package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.VanSaleAdvance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VanSaleAdvanceRepository extends JpaRepository<VanSaleAdvance, Long> {
    boolean existsByDocNumber(String docNumber);
}
