package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.EmployeeStock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface EmployeeStockRepository extends JpaRepository<EmployeeStock, Long> {
    Optional<EmployeeStock> findByEmployeeIdAndProductId(Long employeeId, Long productId);
    List<EmployeeStock> findByEmployeeId(Long employeeId);

    // PESSIMISTIC_WRITE (SELECT ... FOR UPDATE) - giong StockRepository.findWithLockBy..., tranh
    // "lost update" khi 1 NVBH co 2 thao tac cham vao "Kho NV" cua minh gan nhu cung luc (vd Ung
    // hang + xuat Hoa don Van-Sale chong lan) - xem EmployeeStockService.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EmployeeStock> findWithLockByEmployeeIdAndProductId(Long employeeId, Long productId);
}
