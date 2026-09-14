package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.InventoryTransfer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryTransferRepository extends JpaRepository<InventoryTransfer, Long> {
    boolean existsByDocNumber(String docNumber);
}
